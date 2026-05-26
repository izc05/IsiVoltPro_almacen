import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  Edit, 
  QrCode, 
  Printer, 
  Download, 
  Eye, 
  X, 
  AlertTriangle,
  Camera
} from 'lucide-react';
import { imageService } from '../services/imageService';
import { imageStore } from '../services/imageStore';

export default function Articulos() {
  const { 
    articulos, 
    proveedores, 
    almacenes,
    crearArticulo, 
    editarArticulo, 
    movimientos
  } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [proveedorFiltro, setProveedorFiltro] = useState('');
  const [almacenFiltro, setAlmacenFiltro] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Ver ficha y QR
  const [modalFichaAbierto, setModalFichaAbierto] = useState(false);
  const [articuloFicha, setArticuloFicha] = useState(null);
  const [modalQrAbierto, setModalQrAbierto] = useState(false);
  const [articuloQr, setArticuloQr] = useState(null);
  const [imagenes, setImagenes] = useState({});

  // Estado del Formulario
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    categoria: '',
    marca: '',
    modelo: '',
    descripcion: '',
    unidad: 'ud',
    stockActual: 0,
    stockMinimo: 5,
    ubicacion: '',
    proveedorPrincipal: '',
    precioEstimado: 0,
    foto: null,
    fotoId: null,
    activo: true
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      const next = {};
      await Promise.all(articulos.map(async (art) => {
        if (art.fotoId) {
          next[art.id] = await imageStore.get(art.fotoId);
        } else if (art.foto) {
          next[art.id] = art.foto;
        }
      }));
      if (!cancelled) {
        setImagenes(next);
      }
    };

    loadImages();
    return () => {
      cancelled = true;
    };
  }, [articulos]);

  // Categorías únicas
  const categorias = Array.from(new Set(articulos.map(a => a.categoria).filter(Boolean)));

  // Filtrado de artículos
  const articulosFiltrados = articulos.filter(art => {
    const cumpleBusqueda = 
      art.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      art.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (art.marca && art.marca.toLowerCase().includes(busqueda.toLowerCase())) ||
      (art.modelo && art.modelo.toLowerCase().includes(busqueda.toLowerCase()));
      
    const cumpleCategoria = categoriaFiltro === '' || art.categoria === categoriaFiltro;
    const cumpleProveedor = proveedorFiltro === '' || art.proveedorPrincipal === proveedorFiltro;
    const cumpleAlmacen = almacenFiltro === '' || (Number(art.stockPorAlmacen?.[almacenFiltro]) || 0) > 0;
    const cumpleActivo = mostrarInactivos ? true : art.activo;

    return cumpleBusqueda && cumpleCategoria && cumpleProveedor && cumpleAlmacen && cumpleActivo;
  });

  const abrirCrear = () => {
    setForm({
      codigo: '',
      nombre: '',
      categoria: '',
      marca: '',
      modelo: '',
      descripcion: '',
      unidad: 'ud',
      stockActual: 0,
      stockMinimo: 5,
      ubicacion: '',
      proveedorPrincipal: proveedores[0]?.nombre || '',
      precioEstimado: 0,
      foto: null,
      fotoId: null,
      activo: true
    });
    setModoEdicion(false);
    setFormError('');
    setModalAbierto(true);
  };

  const abrirEditar = (art) => {
    setForm({ ...art });
    setArticuloSeleccionado(art);
    setModoEdicion(true);
    setFormError('');
    setModalAbierto(true);
  };

  const abrirFicha = (art) => {
    setArticuloFicha(art);
    setModalFichaAbierto(true);
  };

  const abrirQr = (art) => {
    setArticuloQr(art);
    setModalQrAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.codigo.trim() || !form.nombre.trim() || !form.categoria.trim()) {
      setFormError('Código, Nombre y Categoría son campos obligatorios.');
      return;
    }

    try {
      const payload = { ...form };
      if (form.foto && form.foto.startsWith('data:')) {
        payload.fotoId = await imageStore.save(form.foto, {
          id: form.fotoId || undefined,
          tipo: 'articulo'
        });
        payload.foto = null;
      }
      if (modoEdicion) {
        editarArticulo(articuloSeleccionado.id, payload);
      } else {
        crearArticulo(payload);
      }
      setModalAbierto(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const toggleActivo = (art) => {
    if (confirm(`¿Estás seguro de que deseas ${art.activo ? 'desactivar' : 'activar'} este artículo?`)) {
      editarArticulo(art.id, { activo: !art.activo });
    }
  };

  const handleFotoArticulo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const image = await imageService.compress(file);
    setForm({ ...form, foto: image });
  };

  const quitarFotoArticulo = async () => {
    if (form.fotoId) {
      await imageStore.remove(form.fotoId);
    }
    setForm({ ...form, foto: null, fotoId: null });
  };

  const getArticuloImage = (art) => {
    return imagenes[art.id] || art.foto || imageService.placeholder(art.nombre);
  };

  const hasArticuloImage = (art) => Boolean(imagenes[art.id] || art.foto || art.fotoId);

  const getStockVisible = (art) => {
    if (!almacenFiltro) return Number(art.stockActual) || 0;
    return Number(art.stockPorAlmacen?.[almacenFiltro]) || 0;
  };

  const getAlmacenNombre = () => almacenes.find((almacen) => almacen.id === almacenFiltro)?.nombre || 'Todos los almacenes';

  // Enlace del QR
  const getQrUrl = (codigo) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(codigo)}`;
  };

  const imprimirEtiqueta = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y botón de crear */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Catálogo de Artículos</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión del stock, ubicaciones y códigos QR de productos.</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center justify-center space-x-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Artículo</span>
        </button>
      </div>

      {/* FILTROS DE BÚSQUEDA */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-amber-500"
          />
        </div>

        {/* Categoría */}
        <div>
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-amber-500"
          >
            <option value="">Todas las Categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Proveedor */}
        <div>
          <select
            value={proveedorFiltro}
            onChange={(e) => setProveedorFiltro(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-amber-500"
          >
            <option value="">Todos los Proveedores</option>
            {proveedores.map(p => (
              <option key={p.id} value={p.nombre}>{p.nombre}</option>
            ))}
          </select>
        </div>

        {/* Almacén */}
        <div>
          <select
            value={almacenFiltro}
            onChange={(e) => setAlmacenFiltro(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-amber-500"
          >
            <option value="">Todos los Almacenes</option>
            {almacenes.map(almacen => (
              <option key={almacen.id} value={almacen.id}>{almacen.nombre}</option>
            ))}
          </select>
        </div>

        {/* Mostrar Inactivos */}
        <div className="flex items-center justify-between sm:justify-end space-x-3 px-1">
          <label className="text-sm font-semibold text-gray-500" htmlFor="verInactivos">
            Ver descatalogados
          </label>
          <input
            id="verInactivos"
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            className="h-5 w-5 rounded-sm border-gray-300 text-amber-600 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">Vista de almacén</p>
          <p className="mt-1 text-sm font-bold text-gray-900">{getAlmacenNombre()}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">Artículos visibles</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{articulosFiltrados.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">Stock en vista</p>
          <p className="mt-1 text-2xl font-black text-amber-600">
            {articulosFiltrados.reduce((sum, art) => sum + getStockVisible(art), 0)}
          </p>
        </div>
      </div>

      {/* VISTA DE LA TABLA (PC) */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-xs border border-gray-100 overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-semibold">
            <tr>
              <th scope="col" className="px-6 py-4">Foto</th>
              <th scope="col" className="px-6 py-4">Código</th>
              <th scope="col" className="px-6 py-4">Artículo</th>
              <th scope="col" className="px-6 py-4">Categoría</th>
              <th scope="col" className="px-6 py-4">Stock</th>
              <th scope="col" className="px-6 py-4">Ubicación</th>
              <th scope="col" className="px-6 py-4">P. Unitario</th>
              <th scope="col" className="px-6 py-4">Estado</th>
              <th scope="col" className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-t border-gray-100 font-medium">
            {articulosFiltrados.map((art) => {
              const stockVisible = getStockVisible(art);
              const esBajo = stockVisible <= art.stockMinimo;
              return (
                <tr key={art.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <img
                      src={getArticuloImage(art)}
                      alt={art.nombre}
                      className="h-14 w-16 rounded-lg border border-gray-100 bg-gray-50 object-cover"
                    />
                    {!hasArticuloImage(art) && (
                      <span className="mt-1 block text-[10px] font-bold text-gray-300">Sin foto</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-900">{art.codigo}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">{art.nombre}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{art.marca} {art.modelo}</div>
                  </td>
                  <td className="px-6 py-4">{art.categoria}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-base font-bold ${esBajo ? 'text-red-600' : 'text-gray-900'}`}>
                        {stockVisible}
                      </span>
                      <span className="text-xs text-gray-400">{art.unidad}</span>
                      {esBajo && (
                        <span className="p-0.5 bg-red-100 text-red-700 rounded-sm text-[10px]" title="Bajo stock mínimo">
                          <AlertTriangle className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono">{art.ubicacion || 'Sin Ubicación'}</td>
                  <td className="px-6 py-4">{art.precioEstimado ? `${art.precioEstimado.toFixed(2)}€` : '0.00€'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      art.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {art.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => abrirFicha(art)} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg" title="Ver Ficha">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => abrirQr(art)} className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg" title="Código QR">
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button onClick={() => abrirEditar(art)} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg" title="Editar">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => toggleActivo(art)} 
                      className={`p-1.5 rounded-lg ${art.activo ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'}`}
                      title={art.activo ? 'Desactivar' : 'Activar'}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {articulosFiltrados.length === 0 && (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-gray-400">No se encontraron artículos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VISTA DE TARJETAS (MÓVIL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
        {articulosFiltrados.map((art) => {
          const stockVisible = getStockVisible(art);
          const esBajo = stockVisible <= art.stockMinimo;
          return (
            <div key={art.id} className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
              <img
                src={getArticuloImage(art)}
                alt={art.nombre}
                className="h-40 w-full rounded-xl border border-gray-100 bg-gray-50 object-cover"
              />
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">{art.codigo}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    art.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {art.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 text-base mt-2">{art.nombre}</h4>
                <p className="text-xs text-gray-500 mt-1">{art.marca} {art.modelo}</p>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-gray-400 font-semibold">Ubicación:</span>
                  <span className="font-mono text-gray-800">{art.ubicacion || 'S/U'}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-sm">
                  <span className="text-gray-400 font-semibold">Precio:</span>
                  <span className="text-gray-800 font-bold">{art.precioEstimado ? `${art.precioEstimado.toFixed(2)}€` : '0.00€'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className={`text-xl font-extrabold ${esBajo ? 'text-red-600' : 'text-gray-900'}`}>
                    {stockVisible}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">{art.unidad}</span>
                  {esBajo && (
                    <span className="p-1 bg-red-100 text-red-700 rounded-full" title="Bajo mínimo">
                      <AlertTriangle className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => abrirFicha(art)} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => abrirQr(art)} className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg">
                    <QrCode className="h-4 w-4" />
                  </button>
                  <button onClick={() => abrirEditar(art)} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => toggleActivo(art)} 
                    className={`p-2 rounded-lg ${art.activo ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {articulosFiltrados.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-12">No se encontraron artículos.</p>
        )}
      </div>

      {/* MODAL: FORMULARIO CREAR / EDITAR */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">{modoEdicion ? 'Editar Artículo' : 'Nuevo Artículo'}</h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={guardar} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-semibold flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Código Interno */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Código Interno *</label>
                  <input
                    type="text"
                    required
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ej. IV-CABLE-01"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Artículo *</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej. Cable Manguera 3G2.5"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Categoría *</label>
                  <input
                    type="text"
                    required
                    list="categorias-form"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    placeholder="Ej. Cables, Canalización..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                  />
                  <datalist id="categorias-form">
                    {categorias.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                {/* Unidad */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Unidad de Medida</label>
                  <select
                    value={form.unidad}
                    onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="ud">Unidades (ud)</option>
                    <option value="metros">Metros (m)</option>
                    <option value="cajas">Cajas</option>
                    <option value="rollos">Rollos</option>
                  </select>
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Marca</label>
                  <input
                    type="text"
                    value={form.marca || ''}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    placeholder="Ej. Schneider"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Modelo</label>
                  <input
                    type="text"
                    value={form.modelo || ''}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                    placeholder="Ej. Harmony"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Stock Actual - SOLO CREACION */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Stock Inicial {modoEdicion && '(Modificar vía Entrada/Salida)'}
                  </label>
                  <input
                    type="number"
                    disabled={modoEdicion}
                    value={form.stockActual}
                    onChange={(e) => setForm({ ...form, stockActual: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 disabled:opacity-50 disabled:bg-gray-100"
                  />
                </div>

                {/* Stock Mínimo */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    value={form.stockMinimo}
                    onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ubicación (Almacén-Estante-Balda)</label>
                  <input
                    type="text"
                    value={form.ubicacion || ''}
                    onChange={(e) => setForm({ ...form, ubicacion: e.target.value.toUpperCase() })}
                    placeholder="Ej. A-02-B1"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Precio Estimado */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Precio Estimado (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.precioEstimado}
                    onChange={(e) => setForm({ ...form, precioEstimado: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Proveedor Principal */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Proveedor Principal</label>
                  <select
                    value={form.proveedorPrincipal || ''}
                    onChange={(e) => setForm({ ...form, proveedorPrincipal: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="">Ninguno</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Estado Activo */}
                <div className="flex items-center space-x-3 px-1 pt-6">
                  <input
                    id="formActivo"
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    className="h-5 w-5 rounded-sm border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label className="text-sm font-semibold text-gray-600" htmlFor="formActivo">
                    Artículo Activo (Disponible en catálogo)
                  </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <Camera className="h-3.5 w-3.5 text-amber-500" />
                  <span>Foto del artículo</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoArticulo}
                  className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {(form.foto || form.fotoId) && (
                  <div className="relative mt-2 w-40 rounded-xl border border-gray-200 bg-gray-50 p-2">
                    <img
                      src={form.foto || imagenes[articuloSeleccionado?.id] || imageService.placeholder(form.nombre)}
                      alt="Artículo"
                      className="h-28 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={quitarFotoArticulo}
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
                <textarea
                  rows="3"
                  value={form.descripcion || ''}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Detalles técnicos adicionales del artículo..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg"
                >
                  Guardar Artículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FICHA DETALLADA E HISTORIAL */}
      {modalFichaAbierto && articuloFicha && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Detalle del Artículo: {articuloFicha.nombre}</h3>
              <button onClick={() => setModalFichaAbierto(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Datos QR */}
                <div className="flex flex-col items-center justify-center border border-gray-100 p-4 rounded-xl bg-gray-50">
                  <img
                    src={getArticuloImage(articuloFicha)}
                    alt={articuloFicha.foto || articuloFicha.fotoId ? 'Foto del artículo' : 'Imagen del artículo'}
                    className="w-40 h-40 object-cover shadow-xs bg-white rounded-lg p-2"
                  />
                  {!hasArticuloImage(articuloFicha) && (
                    <span className="mt-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-400">Foto pendiente</span>
                  )}
                  <span className="font-mono text-sm font-bold text-gray-800 mt-2">{articuloFicha.codigo}</span>
                </div>

                {/* Datos Generales */}
                <div className="md:col-span-2 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div>
                    <span className="text-gray-400 font-bold block">Categoría</span>
                    <span className="text-gray-800 font-semibold">{articuloFicha.categoria}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block">Marca / Modelo</span>
                    <span className="text-gray-800 font-semibold">{articuloFicha.marca || '-'} / {articuloFicha.modelo || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block">Stock Actual</span>
                    <span className="text-gray-800 font-bold text-lg">{articuloFicha.stockActual} {articuloFicha.unidad}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block">Stock Mínimo</span>
                    <span className="text-gray-800 font-semibold">{articuloFicha.stockMinimo} {articuloFicha.unidad}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block">Ubicación</span>
                    <span className="text-gray-800 font-mono font-semibold">{articuloFicha.ubicacion || 'Sin Ubicación'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block">Precio Estimado</span>
                    <span className="text-gray-800 font-bold">{articuloFicha.precioEstimado ? `${articuloFicha.precioEstimado.toFixed(2)}€` : '0.00€'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 font-bold block">Proveedor Principal</span>
                    <span className="text-gray-800 font-semibold">{articuloFicha.proveedorPrincipal || 'Ninguno'}</span>
                  </div>
                </div>
              </div>

              {articuloFicha.descripcion && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm">
                  <h4 className="font-bold text-gray-800 mb-1">Descripción</h4>
                  <p className="text-gray-600 leading-relaxed">{articuloFicha.descripcion}</p>
                </div>
              )}

              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <h4 className="font-bold text-gray-800 mb-3">Stock por almacén</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {almacenes.map((almacen) => (
                    <div key={almacen.id} className="flex items-center justify-between rounded-lg bg-white border border-gray-100 px-3 py-2 text-sm">
                      <span className="font-semibold text-gray-600">{almacen.nombre}</span>
                      <span className="font-black text-gray-900">
                        {Number(articuloFicha.stockPorAlmacen?.[almacen.id]) || 0} {articuloFicha.unidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historial de Movimientos de este Artículo */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-base">Historial de Movimientos</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {movimientos.filter(m => m.articuloId === articuloFicha.id).map(mov => (
                    <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 text-xs">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {mov.tipo === 'entrada' ? 'ENTRADA' : mov.tipo === 'salida' ? 'SALIDA (RETIRADA)' : 'AJUSTE'} 
                          <span className="text-gray-400 font-normal"> - {mov.origenDestino}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Documento: {mov.documento || '-'} • {new Date(mov.fecha).toLocaleString('es-ES')}
                        </div>
                        {mov.observaciones && (
                          <div className="text-gray-500 italic mt-1">Obs: {mov.observaciones}</div>
                        )}
                      </div>
                      <span className={`font-bold text-sm px-2 py-0.5 rounded-lg ${
                        mov.tipo === 'entrada' ? 'bg-blue-100 text-blue-800' : mov.tipo === 'salida' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {mov.tipo === 'entrada' ? '+' : ''}{mov.cantidad}
                      </span>
                    </div>
                  ))}
                  {movimientos.filter(m => m.articuloId === articuloFicha.id).length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-6">No hay movimientos registrados para este artículo.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / VISTA DE ETIQUETA QR A IMPRIMIR */}
      {modalQrAbierto && articuloQr && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Etiqueta QR</h3>
              <button onClick={() => setModalQrAbierto(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center space-y-6">
              {/* ETIQUETA IMPRIMIBLE */}
              <div id="print-label-area" className="border-4 border-gray-900 p-6 rounded-xl text-center bg-white text-gray-950 w-72 flex flex-col items-center print-card">
                <h3 className="font-extrabold text-lg tracking-tight border-b-2 border-gray-950 pb-2 w-full">
                  IsiVolt<span className="text-amber-600">Pro</span> <span className="font-light text-sm">Almacén</span>
                </h3>
                
                <img 
                  src={getQrUrl(articuloQr.codigo)} 
                  alt="QR Label" 
                  className="w-48 h-48 object-contain my-4 border border-gray-100 p-2 rounded-lg bg-white"
                />

                <div className="text-xs uppercase font-bold text-gray-500 tracking-wider">Código de Artículo</div>
                <div className="font-mono text-sm font-extrabold tracking-wide text-gray-900 border border-gray-200 px-2 py-0.5 rounded bg-gray-50">{articuloQr.codigo}</div>
                
                <div className="font-bold text-sm mt-3 line-clamp-1">{articuloQr.nombre}</div>
                
                <div className="mt-2 text-xs font-semibold text-gray-600 flex items-center justify-center space-x-2">
                  <span>Ubicación:</span>
                  <span className="font-mono bg-amber-100 px-2 py-0.5 rounded text-amber-900 font-extrabold">{articuloQr.ubicacion || 'S/U'}</span>
                </div>
              </div>

              {/* ACCIONES DE ETIQUETA */}
              <div className="flex items-center space-x-3 w-full">
                <button
                  onClick={imprimirEtiqueta}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  <Printer className="h-5 w-5" />
                  <span>Imprimir Etiqueta</span>
                </button>
                
                <a
                  href={getQrUrl(articuloQr.codigo)}
                  target="_blank"
                  rel="noreferrer"
                  download={`QR-${articuloQr.codigo}.png`}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-xs transition-colors text-center"
                >
                  <Download className="h-5 w-5 text-amber-500" />
                  <span>Descargar QR</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESTRUCTURA EXCLUSIVA PARA LA IMPRESIÓN (OCULTA EN PANTALLA) */}
      {articuloQr && (
        <div className="hidden print-only print:flex flex-col items-center justify-center min-h-screen bg-white">
          <div className="border-[6px] border-black p-8 rounded-2xl text-center bg-white text-black w-[15cm] flex flex-col items-center">
            <h1 className="font-black text-3xl tracking-tight border-b-4 border-black pb-4 w-full m-0">
              IsiVoltPro <span className="font-light text-2xl">Almacén</span>
            </h1>
            <img 
              src={getQrUrl(articuloQr.codigo)} 
              alt="QR Code" 
              className="w-80 h-80 object-contain my-6 border-2 border-black p-4 rounded-xl"
            />
            <div className="text-lg uppercase font-bold text-gray-500 tracking-wider">Código de Artículo</div>
            <div className="font-mono text-2xl font-black tracking-wide border border-black px-4 py-1 rounded bg-gray-50">{articuloQr.codigo}</div>
            <div className="font-black text-xl mt-6">{articuloQr.nombre}</div>
            <div className="text-lg text-gray-700 mt-2">{articuloQr.marca} {articuloQr.modelo}</div>
            <div className="mt-4 text-lg font-bold flex items-center space-x-3">
              <span>Ubicación:</span>
              <span className="font-mono bg-gray-200 px-4 py-1 rounded text-black font-black text-xl">{articuloQr.ubicacion || 'Sin Ubicación'}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
