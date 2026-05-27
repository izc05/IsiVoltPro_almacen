import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle, Download, History, Package, QrCode, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ALMACEN_ID = 'alm-principal';
const ALMACEN_NOMBRE = 'Almacén principal';
const normalize = (v = '') => String(v).trim().toUpperCase();

function matchArticulo(articulos, value) {
  const code = normalize(value);
  if (!code) return null;
  return articulos.find((art) => [art.codigo, art.qr, art.codigoBarras, art.ean, art.codigoFabricante]
    .filter(Boolean)
    .some((item) => normalize(item) === code));
}

function descargarCSV(nombreArchivo, filas) {
  const csv = filas.map((fila) => fila.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function MovimientosV2() {
  const { articulos, proveedores, movimientos, registrarEntrada, setActiveTab } = useApp();

  const [activeTabSub, setActiveTabSub] = useState('entrada');
  const [codigo, setCodigo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [articuloId, setArticuloId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [proveedor, setProveedor] = useState(proveedores[0]?.nombre || 'General');
  const [documento, setDocumento] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [historialBusqueda, setHistorialBusqueda] = useState('');

  const articulosActivos = articulos.filter((art) => art.activo !== false);
  const articulo = articulos.find((art) => art.id === articuloId) || null;
  const stockActual = articulo ? Number(articulo.stockPorAlmacen?.[ALMACEN_ID] ?? articulo.stockActual) || 0 : 0;

  const sugerencias = useMemo(() => {
    const q = `${busqueda} ${codigo}`.trim().toLowerCase();
    if (!q) return articulosActivos.slice(0, 10);
    return articulosActivos.filter((art) => `${art.codigo} ${art.qr || ''} ${art.codigoBarras || ''} ${art.ean || ''} ${art.nombre} ${art.categoria} ${art.marca || ''} ${art.modelo || ''} ${art.ubicacion || ''}`.toLowerCase().includes(q)).slice(0, 12);
  }, [articulosActivos, busqueda, codigo]);

  const seleccionarArticulo = (art) => {
    setArticuloId(art.id);
    setCodigo(art.codigoBarras || art.ean || art.codigo || '');
    setBusqueda('');
    setUbicacion(art.ubicacion || '');
    setError('');
  };

  const buscarPorCodigo = () => {
    const encontrado = matchArticulo(articulosActivos, codigo);
    if (!encontrado) {
      setError('Código no encontrado. Busca por nombre o crea el artículo en Artículos.');
      return;
    }
    seleccionarArticulo(encontrado);
  };

  const guardarEntrada = (e) => {
    e.preventDefault();
    setError('');
    setOk('');

    if (!articulo) return setError('Selecciona o escanea primero un artículo.');
    if (!Number(cantidad) || Number(cantidad) <= 0) return setError('Indica una cantidad válida.');

    try {
      registrarEntrada(articulo.id, cantidad, {
        proveedor,
        documento,
        observaciones: [ubicacion ? `Ubicación colocación: ${ubicacion}` : '', observaciones].filter(Boolean).join(' · '),
        almacenId: ALMACEN_ID
      });
      setOk(`Entrada guardada: +${cantidad} ${articulo.unidad || 'uds'} · ${articulo.nombre}`);
      setArticuloId('');
      setCodigo('');
      setBusqueda('');
      setCantidad('');
      setDocumento('');
      setObservaciones('');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la entrada.');
    }
  };

  const movimientosFiltrados = movimientos.filter((mov) => {
    const text = `${mov.articuloNombre} ${mov.codigo} ${mov.origenDestino} ${mov.documento} ${mov.almacenNombre} ${mov.observaciones || ''}`.toLowerCase();
    return text.includes(historialBusqueda.toLowerCase()) && (tipoFiltro === 'todos' || mov.tipo === tipoFiltro);
  });

  const exportarHistorial = () => {
    const filas = [
      ['Fecha', 'Tipo', 'Artículo', 'Código', 'Cantidad', 'Proveedor/Técnico', 'Documento', 'Observaciones'],
      ...movimientosFiltrados.map((mov) => [new Date(mov.fecha).toLocaleString('es-ES'), mov.tipo, mov.articuloNombre, mov.codigo, mov.cantidad, mov.origenDestino, mov.documento || '', mov.observaciones || ''])
    ];
    descargarCSV('movimientos_almacen.csv', filas);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Entradas y salidas</h2>
          <p className="mt-1 text-sm text-gray-500">Entrada rápida por código/EAN o búsqueda. Para retiradas por técnico usa la pestaña Retirada.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-100 p-1">
          <TabButton id="entrada" active={activeTabSub} onClick={setActiveTabSub} icon={ArrowDownLeft} label="Entrada" />
          <TabButton id="historial" active={activeTabSub} onClick={setActiveTabSub} icon={History} label="Historial" />
          <button onClick={() => setActiveTab('retirada')} className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-gray-500 hover:text-gray-900"><ArrowUpRight className="h-4 w-4" />Retirada</button>
          <button onClick={() => setActiveTab('qr')} className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-gray-500 hover:text-gray-900"><QrCode className="h-4 w-4" />QR</button>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertTriangle className="h-5 w-5" />{error}</div>}
      {ok && <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><CheckCircle className="h-5 w-5" />{ok}</div>}

      {activeTabSub === 'entrada' && (
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900"><QrCode className="h-5 w-5 text-blue-600" /> Localizar artículo</h3>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') buscarPorCodigo(); }} placeholder="Escanea/pega EAN, QR o código interno" className="field font-mono" />
                <button onClick={buscarPorCodigo} className="rounded-xl bg-gray-950 px-5 py-3 text-xs font-black text-white">Buscar código</button>
              </div>

              <div className="mt-4 relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, marca, modelo, ubicación..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500" />
              </div>

              <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                {sugerencias.map((art) => {
                  const stock = Number(art.stockPorAlmacen?.[ALMACEN_ID] ?? art.stockActual) || 0;
                  const selected = articuloId === art.id;
                  return (
                    <button key={art.id} type="button" onClick={() => seleccionarArticulo(art)} className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${selected ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/50'}`}>
                      <div className="min-w-0">
                        <p className="truncate font-black text-gray-900">{art.nombre}</p>
                        <p className="truncate font-mono text-xs font-bold text-gray-500">{art.codigo} · {art.codigoBarras || art.ean || 'sin EAN'} · {art.ubicacion || 'sin ubicación'}</p>
                      </div>
                      <span className="rounded-xl bg-white px-3 py-1 text-sm font-black text-gray-900">{stock}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <form onSubmit={guardarEntrada} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="mb-5 border-b border-gray-100 pb-4">
              <h3 className="flex items-center gap-2 text-lg font-black text-gray-900"><ArrowDownLeft className="h-5 w-5 text-blue-600" /> Recepcionar entrada</h3>
              <p className="mt-1 text-sm font-bold text-gray-400">{ALMACEN_NOMBRE}</p>
            </div>

            {articulo ? (
              <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-blue-700">Artículo seleccionado</p>
                <h4 className="mt-1 font-black text-gray-900">{articulo.nombre}</h4>
                <p className="mt-1 font-mono text-xs font-bold text-gray-500">{articulo.codigo} · {articulo.codigoBarras || articulo.ean || 'sin EAN'}</p>
                <p className="mt-2 text-sm font-bold text-gray-700">Stock actual: <span className="text-xl font-black">{stockActual}</span> {articulo.unidad || 'uds'}</p>
              </div>
            ) : (
              <div className="mb-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm font-bold text-gray-400">Selecciona un artículo de la lista o escanea su código.</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cantidad recibida *"><input required min="1" type="number" inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="field text-2xl font-black" /></Field>
              <Field label="Proveedor"><select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="field"><option value="General">General</option>{proveedores.map((prov) => <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>)}</select></Field>
              <Field label="Albarán / documento"><input value={documento} onChange={(e) => setDocumento(e.target.value.toUpperCase())} placeholder="ALB-..." className="field font-mono" /></Field>
              <Field label="Ubicación donde se coloca"><input value={ubicacion} onChange={(e) => setUbicacion(e.target.value.toUpperCase())} placeholder="PASILLO-A / ELE-A01-B1" className="field font-mono" /></Field>
            </div>

            <Field label="Observaciones"><textarea rows="3" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="field resize-none" /></Field>

            <button type="submit" className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white hover:bg-blue-700">Guardar entrada</button>
          </form>
        </section>
      )}

      {activeTabSub === 'historial' && (
        <section className="space-y-5">
          <div className="grid gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-xs md:grid-cols-[1fr_180px_auto]">
            <div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" /><input value={historialBusqueda} onChange={(e) => setHistorialBusqueda(e.target.value)} placeholder="Buscar en historial..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-500" /></div>
            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="field"><option value="todos">Todos</option><option value="entrada">Entradas</option><option value="salida">Salidas</option><option value="ajuste">Ajustes</option></select>
            <button onClick={exportarHistorial} className="rounded-xl bg-gray-950 px-4 py-3 text-xs font-black text-white"><Download className="mr-1 inline h-4 w-4" />CSV</button>
          </div>
          <div className="space-y-3">
            {movimientosFiltrados.slice(0, 80).map((mov) => <article key={mov.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs"><div className="flex items-start justify-between gap-3"><div><span className={`rounded-full px-2 py-1 text-xs font-black uppercase ${mov.tipo === 'entrada' ? 'bg-blue-100 text-blue-700' : mov.tipo === 'salida' ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-700'}`}>{mov.tipo}</span><h3 className="mt-2 font-black text-gray-900">{mov.articuloNombre}</h3><p className="font-mono text-xs text-gray-400">{mov.codigo}</p><p className="mt-1 text-xs font-semibold text-gray-500">{mov.origenDestino} · {mov.documento || 'Sin documento'} · {new Date(mov.fecha).toLocaleString('es-ES')}</p></div><span className={`rounded-xl px-3 py-2 text-sm font-black ${mov.tipo === 'entrada' ? 'bg-blue-50 text-blue-700' : mov.tipo === 'salida' ? 'bg-rose-50 text-rose-700' : 'bg-purple-50 text-purple-700'}`}>{mov.tipo === 'entrada' ? '+' : mov.tipo === 'salida' ? '-' : ''}{Math.abs(Number(mov.cantidad || 0))}</span></div></article>)}
          </div>
        </section>
      )}
    </div>
  );
}

function TabButton({ id, active, onClick, icon: Icon, label }) {
  return <button onClick={() => onClick(id)} className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-colors ${active === id ? 'bg-gray-950 text-white' : 'bg-white text-gray-500 hover:text-gray-900'}`}><Icon className="h-4 w-4" />{label}</button>;
}

function Field({ label, children }) {
  return <label className="mt-4 block"><span className="label-mini">{label}</span>{children}</label>;
}
