import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle, Download, Package, Plus, Search, Trash2, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

const normalize = (value = '') => String(value).trim().toUpperCase();

function buscarArticulo(articulos, codigo) {
  const code = normalize(codigo);
  return articulos.find((art) => [art.codigo, art.qr, art.codigoBarras, art.ean, art.codigoFabricante]
    .filter(Boolean)
    .some((value) => normalize(value) === code));
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

export default function RetiradaRapida() {
  const { articulos, tecnicos, movimientos, registrarSalida, currentUser } = useApp();
  const [tecnicoId, setTecnicoId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [documento, setDocumento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');

  const tecnicosActivos = tecnicos.filter((tec) => tec.activo !== false);
  const tecnicoSeleccionado = tecnicosActivos.find((tec) => tec.id === tecnicoId) || null;
  const articulosActivos = articulos.filter((art) => art.activo !== false);

  const sugerencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return articulosActivos.slice(0, 8);
    return articulosActivos.filter((art) => `${art.codigo} ${art.qr || ''} ${art.codigoBarras || ''} ${art.ean || ''} ${art.nombre} ${art.categoria} ${art.ubicacion}`.toLowerCase().includes(q)).slice(0, 8);
  }, [articulosActivos, busqueda]);

  const salidasFiltradas = movimientos.filter((mov) => {
    if (mov.tipo !== 'salida') return false;
    const tecnicoOK = !filtroTecnico || mov.origenDestino === filtroTecnico;
    const tecnicoMov = tecnicos.find((tec) => tec.nombre === mov.origenDestino);
    const seccionOK = !filtroSeccion || tecnicoMov?.seccion === filtroSeccion;
    return tecnicoOK && seccionOK;
  });

  const secciones = Array.from(new Set(tecnicosActivos.map((tec) => tec.seccion).filter(Boolean))).sort();

  const addArticulo = (art, qty = cantidad) => {
    setError('');
    if (!tecnicoSeleccionado) return setError('Selecciona primero el técnico que retira el material.');
    if (!art) return setError('Artículo no encontrado. Puedes crearlo antes en Artículos.');
    const cantidadNum = Number(qty) || 0;
    if (cantidadNum <= 0) return setError('La cantidad debe ser mayor que 0.');
    const stock = Number(art.stockPorAlmacen?.['alm-principal'] ?? art.stockActual) || 0;
    if (cantidadNum > stock) return setError(`Stock insuficiente. Disponible: ${stock} ${art.unidad || 'uds'}.`);

    setCarrito((prev) => {
      const existe = prev.find((item) => item.articulo.id === art.id);
      if (existe) {
        return prev.map((item) => item.articulo.id === art.id ? { ...item, cantidad: item.cantidad + cantidadNum } : item);
      }
      return [...prev, { articulo: art, cantidad: cantidadNum }];
    });
    setCodigo('');
    setBusqueda('');
    setCantidad('1');
    setOk(`${art.nombre} añadido a la retirada.`);
    setTimeout(() => setOk(''), 2000);
  };

  const buscarYAgregar = () => {
    const art = buscarArticulo(articulosActivos, codigo);
    addArticulo(art);
  };

  const quitarLinea = (id) => setCarrito((prev) => prev.filter((item) => item.articulo.id !== id));

  const guardarRetirada = () => {
    setError('');
    setOk('');
    if (!tecnicoSeleccionado) return setError('Selecciona un técnico.');
    if (carrito.length === 0) return setError('Añade al menos un material a la retirada.');

    try {
      carrito.forEach((item) => {
        registrarSalida(item.articulo.id, item.cantidad, {
          tecnico: tecnicoSeleccionado.nombre,
          documento: documento || 'RETIRADA-RAPIDA',
          observaciones: [
            `Sección técnico: ${tecnicoSeleccionado.seccion || 'Sin sección'}`,
            observaciones
          ].filter(Boolean).join(' · '),
          almacenId: 'alm-principal',
          usuario: currentUser?.nombre || 'Usuario'
        });
      });
      setOk(`Retirada guardada: ${carrito.length} líneas para ${tecnicoSeleccionado.nombre}.`);
      setCarrito([]);
      setDocumento('');
      setObservaciones('');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la retirada.');
    }
  };

  const exportarActual = () => {
    const filas = [
      ['Fecha', 'Técnico', 'Sección', 'Código', 'EAN', 'Artículo', 'Cantidad', 'Unidad', 'Ubicación', 'Documento', 'Observaciones'],
      ...salidasFiltradas.map((mov) => {
        const art = articulos.find((a) => a.id === mov.articuloId || a.codigo === mov.codigo);
        const tec = tecnicos.find((t) => t.nombre === mov.origenDestino);
        return [new Date(mov.fecha).toLocaleString('es-ES'), mov.origenDestino, tec?.seccion || '', mov.codigo, art?.codigoBarras || art?.ean || '', mov.articuloNombre, Math.abs(Number(mov.cantidad || 0)), art?.unidad || '', art?.ubicacion || '', mov.documento || '', mov.observaciones || ''];
      })
    ];
    descargarCSV('retiradas_material.csv', filas);
  };

  const totalLineas = carrito.length;
  const totalUnidades = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Retirada rápida</h2>
          <p className="mt-1 text-sm text-gray-500">Selecciona técnico, escanea o busca material, añade cantidad y guarda la retirada.</p>
        </div>
        <button onClick={exportarActual} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-3 text-sm font-black text-white hover:bg-gray-800">
          <Download className="h-5 w-5 text-amber-400" /> Descargar retiradas
        </button>
      </div>

      {error && <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertTriangle className="h-5 w-5" />{error}</div>}
      {ok && <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><CheckCircle className="h-5 w-5" />{ok}</div>}

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900"><UserCheck className="h-5 w-5 text-amber-500" /> Técnico que retira</h3>
            <select value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)} className="field text-base font-black">
              <option value="">Selecciona técnico...</option>
              {tecnicosActivos.map((tec) => <option key={tec.id} value={tec.id}>{tec.nombre} · {tec.seccion || 'Sin sección'}</option>)}
            </select>
            {tecnicoSeleccionado && <div className="mt-4 rounded-2xl bg-amber-50 p-4"><p className="font-black text-gray-900">{tecnicoSeleccionado.nombre}</p><p className="text-sm font-bold text-amber-700">{tecnicoSeleccionado.seccion || 'Sin sección'}</p></div>}
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900"><Package className="h-5 w-5 text-amber-500" /> Añadir material</h3>
            <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
              <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') buscarYAgregar(); }} placeholder="Escanea/pega QR, EAN o código interno" className="field font-mono" />
              <input value={cantidad} onChange={(e) => setCantidad(e.target.value)} type="number" inputMode="numeric" min="1" className="field text-center text-xl font-black" />
            </div>
            <button onClick={buscarYAgregar} className="mt-3 w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-gray-950 hover:bg-amber-400"><Plus className="mr-2 inline h-5 w-5" /> Añadir por código</button>

            <div className="mt-5">
              <div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar si no hay QR creado..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-500" /></div>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {sugerencias.map((art) => {
                  const stock = Number(art.stockPorAlmacen?.['alm-principal'] ?? art.stockActual) || 0;
                  return <button key={art.id} onClick={() => addArticulo(art)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-left hover:border-amber-200 hover:bg-amber-50"><div className="min-w-0"><p className="truncate font-black text-gray-900">{art.nombre}</p><p className="truncate font-mono text-xs font-bold text-gray-500">{art.codigo} · {art.codigoBarras || art.ean || 'sin EAN'} · {art.ubicacion || 'sin ubicación'}</p></div><span className="rounded-xl bg-white px-3 py-1 text-sm font-black text-gray-900">{stock}</span></button>;
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-lg font-black text-gray-900">Carrito de retirada</h3><p className="text-sm text-gray-500">{totalLineas} líneas · {totalUnidades} unidades</p></div><ArrowUpRight className="h-6 w-6 text-rose-500" /></div>
            <div className="space-y-3">
              {carrito.map((item) => <div key={item.articulo.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3"><div className="min-w-0"><p className="truncate font-black text-gray-900">{item.articulo.nombre}</p><p className="truncate font-mono text-xs font-bold text-gray-500">{item.articulo.codigo} · {item.articulo.ubicacion || 'sin ubicación'}</p></div><div className="flex items-center gap-2"><span className="rounded-xl bg-white px-3 py-1 text-lg font-black text-gray-900">{item.cantidad}</span><button onClick={() => quitarLinea(item.articulo.id)} className="rounded-xl bg-rose-50 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button></div></div>)}
              {carrito.length === 0 && <p className="rounded-2xl bg-gray-50 p-5 text-center text-sm font-bold text-gray-400">Aún no hay material añadido.</p>}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><input value={documento} onChange={(e) => setDocumento(e.target.value.toUpperCase())} placeholder="OT / parte / documento" className="field font-mono" /><input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones" className="field" /></div>
            <button onClick={guardarRetirada} className="mt-4 w-full rounded-2xl bg-gray-950 px-5 py-4 text-sm font-black text-white hover:bg-gray-800">Guardar retirada completa</button>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="mb-4 text-lg font-black text-gray-900">Descargas rápidas</h3>
            <div className="grid gap-3 sm:grid-cols-2"><select value={filtroTecnico} onChange={(e) => setFiltroTecnico(e.target.value)} className="field"><option value="">Todos los técnicos</option>{tecnicosActivos.map((tec) => <option key={tec.id} value={tec.nombre}>{tec.nombre}</option>)}</select><select value={filtroSeccion} onChange={(e) => setFiltroSeccion(e.target.value)} className="field"><option value="">Todas las secciones</option>{secciones.map((sec) => <option key={sec} value={sec}>{sec}</option>)}</select></div>
            <p className="mt-3 text-sm font-bold text-gray-500">{salidasFiltradas.length} retiradas encontradas para descargar.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
