import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Camera, CheckCircle, History, PenTool, QrCode, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { imageService } from '../services/imageService';

const ALMACEN_ID = 'alm-principal';
const ALMACEN_NOMBRE = 'Almacén principal';

const emptyEntrada = {
  articuloId: '',
  proveedor: '',
  cantidad: '',
  documento: '',
  observaciones: '',
  foto: null,
  almacenId: ALMACEN_ID
};

const emptySalida = {
  articuloId: '',
  tecnico: '',
  cantidad: '',
  documento: '',
  zona: '',
  observaciones: '',
  firma: null,
  foto: null,
  almacenId: ALMACEN_ID
};

export default function Movimientos() {
  const {
    articulos,
    tecnicos,
    proveedores,
    movimientos,
    registrarEntrada,
    registrarSalida,
    currentUser,
    setActiveTab
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState('rapido');
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [entrada, setEntrada] = useState({ ...emptyEntrada, proveedor: proveedores[0]?.nombre || '' });
  const [salida, setSalida] = useState({ ...emptySalida, tecnico: tecnicos[0]?.nombre || '' });
  const [errorForm, setErrorForm] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const articulosActivos = articulos.filter((art) => art.activo);
  const tecnicosActivos = tecnicos.filter((tec) => tec.activo);

  useEffect(() => {
    if (activeTabSub === 'salida' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
    }
  }, [activeTabSub]);

  const selectedArticulo = (id) => articulos.find((art) => art.id === id);
  const stockArticulo = (articuloId) => Number(selectedArticulo(articuloId)?.stockPorAlmacen?.[ALMACEN_ID] ?? selectedArticulo(articuloId)?.stockActual) || 0;

  const setOk = (mensaje) => {
    setOkMsg(mensaje);
    setTimeout(() => setOkMsg(''), 3500);
  };

  const getPointer = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = event.touches?.[0] || event;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    isDrawingRef.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const point = getPointer(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const point = getPointer(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!canvasRef.current) return;
    isDrawingRef.current = false;
    setSalida((prev) => ({ ...prev, firma: canvasRef.current.toDataURL('image/png') }));
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setSalida((prev) => ({ ...prev, firma: null }));
  };

  const compressFile = async (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = await imageService.compress(file, 1024, 0.68);
    setter((prev) => ({ ...prev, foto: image }));
  };

  const guardarEntrada = (event) => {
    event.preventDefault();
    setErrorForm('');
    try {
      registrarEntrada(entrada.articuloId, entrada.cantidad, { ...entrada, almacenId: ALMACEN_ID });
      const art = selectedArticulo(entrada.articuloId);
      setEntrada({ ...emptyEntrada, proveedor: proveedores[0]?.nombre || '' });
      setOk(`Entrada guardada: ${art?.nombre || 'material'} +${entrada.cantidad}`);
      setActiveTabSub('rapido');
    } catch (error) {
      setErrorForm(error.message);
    }
  };

  const guardarSalida = (event) => {
    event.preventDefault();
    setErrorForm('');
    if (!salida.firma) {
      setErrorForm('La firma digital es obligatoria para registrar una retirada.');
      return;
    }
    try {
      registrarSalida(salida.articuloId, salida.cantidad, {
        ...salida,
        almacenId: ALMACEN_ID,
        tecnico: salida.tecnico || currentUser?.tecnicoNombre || currentUser?.nombre,
        observaciones: [salida.zona ? `Zona/trabajo: ${salida.zona}` : '', salida.observaciones].filter(Boolean).join(' · ')
      });
      const art = selectedArticulo(salida.articuloId);
      setSalida({ ...emptySalida, tecnico: tecnicosActivos[0]?.nombre || '' });
      limpiarFirma();
      setOk(`Salida guardada: ${art?.nombre || 'material'} -${salida.cantidad}`);
      setActiveTabSub('rapido');
    } catch (error) {
      setErrorForm(error.message);
    }
  };

  const movimientosFiltrados = movimientos.filter((mov) => {
    const text = `${mov.articuloNombre} ${mov.codigo} ${mov.origenDestino} ${mov.documento} ${mov.almacenNombre}`.toLowerCase();
    return text.includes(busqueda.toLowerCase()) && (tipoFiltro === 'todos' || mov.tipo === tipoFiltro);
  });

  const TabButton = ({ id, icon: Icon, label, tone = 'gray' }) => (
    <button
      onClick={() => { setActiveTabSub(id); setErrorForm(''); }}
      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-colors ${
        activeTabSub === id
          ? tone === 'blue' ? 'bg-blue-600 text-white' : tone === 'rose' ? 'bg-rose-600 text-white' : 'bg-gray-950 text-white'
          : 'bg-white text-gray-500 hover:text-gray-900'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Entradas y salidas</h2>
          <p className="mt-1 text-sm text-gray-500">Flujo rápido para móvil. Todo trabaja sobre {ALMACEN_NOMBRE}; no hay traspasos ni almacenes secundarios.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-100 p-1">
          <TabButton id="rapido" icon={QrCode} label="Modo rápido" />
          <TabButton id="entrada" icon={ArrowDownLeft} label="Entrada" tone="blue" />
          <TabButton id="salida" icon={ArrowUpRight} label="Salida" tone="rose" />
          <TabButton id="historial" icon={History} label="Historial" />
        </div>
      </div>

      {okMsg && <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle className="h-5 w-5" />{okMsg}</div>}
      {errorForm && <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertTriangle className="h-5 w-5" />{errorForm}</div>}

      {activeTabSub === 'rapido' && (
        <section className="grid gap-5 lg:grid-cols-3">
          <QuickCard icon={QrCode} title="Escanear con móvil" text="Abre QR rápido para entrada, salida o inventario desde cámara." onClick={() => setActiveTab('qr')} primary />
          <QuickCard icon={ArrowDownLeft} title="Entrada rápida" text="Selecciona artículo, cantidad y guardar. Proveedor y albarán son opcionales." onClick={() => setActiveTabSub('entrada')} />
          <QuickCard icon={ArrowUpRight} title="Salida rápida" text="Artículo, técnico, cantidad y firma. Pensado para retirar material en segundos." onClick={() => setActiveTabSub('salida')} />
        </section>
      )}

      {activeTabSub === 'entrada' && (
        <FormCard title="Entrada rápida de material" icon={ArrowDownLeft} tone="blue">
          <form onSubmit={guardarEntrada} className="space-y-4">
            <ArticuloSelect value={entrada.articuloId} onChange={(value) => setEntrada({ ...entrada, articuloId: value })} articulos={articulosActivos} />
            {entrada.articuloId && <MiniArticulo art={selectedArticulo(entrada.articuloId)} stock={stockArticulo(entrada.articuloId)} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Cantidad que entra" value={entrada.cantidad} onChange={(value) => setEntrada({ ...entrada, cantidad: value })} />
              <label className="block"><span className="label-mini">Proveedor opcional</span><select value={entrada.proveedor} onChange={(event) => setEntrada({ ...entrada, proveedor: event.target.value })} className="field"><option value="General">General</option>{proveedores.map((prov) => <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>)}</select></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Albarán / documento opcional" value={entrada.documento} onChange={(value) => setEntrada({ ...entrada, documento: value.toUpperCase() })} />
              <ReadOnlyLocation />
            </div>
            <PhotoInput label="Foto opcional del albarán/material" image={entrada.foto} onFile={(event) => compressFile(event, setEntrada)} onClear={() => setEntrada((prev) => ({ ...prev, foto: null }))} />
            <Textarea value={entrada.observaciones} onChange={(value) => setEntrada({ ...entrada, observaciones: value })} />
            <FormActions onCancel={() => setActiveTabSub('rapido')} submitLabel="Guardar entrada" tone="blue" />
          </form>
        </FormCard>
      )}

      {activeTabSub === 'salida' && (
        <FormCard title="Salida rápida / retirada por técnico" icon={ArrowUpRight} tone="rose">
          <form onSubmit={guardarSalida} className="space-y-4">
            <ArticuloSelect value={salida.articuloId} onChange={(value) => setSalida({ ...salida, articuloId: value })} articulos={articulosActivos} showStock />
            {salida.articuloId && <MiniArticulo art={selectedArticulo(salida.articuloId)} stock={stockArticulo(salida.articuloId)} danger={stockArticulo(salida.articuloId) <= selectedArticulo(salida.articuloId)?.stockMinimo} />}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block"><span className="label-mini">Técnico *</span><select value={salida.tecnico || currentUser?.tecnicoNombre || ''} onChange={(event) => setSalida({ ...salida, tecnico: event.target.value })} className="field" required><option value="">Selecciona técnico...</option>{tecnicosActivos.map((tec) => <option key={tec.id} value={tec.nombre}>{tec.nombre}</option>)}</select></label>
              <NumberField label={`Cantidad (${stockArticulo(salida.articuloId)} disp.)`} value={salida.cantidad} onChange={(value) => setSalida({ ...salida, cantidad: value })} />
              <TextField label="OT / trabajo" value={salida.documento} onChange={(value) => setSalida({ ...salida, documento: value.toUpperCase() })} />
            </div>
            <TextField label="Zona donde se usará" value={salida.zona} onChange={(value) => setSalida({ ...salida, zona: value })} />
            <PhotoInput label="Foto opcional" image={salida.foto} onFile={(event) => compressFile(event, setSalida)} onClear={() => setSalida((prev) => ({ ...prev, foto: null }))} />
            <div><span className="label-mini flex items-center gap-1"><PenTool className="h-3.5 w-3.5 text-amber-500" /> Firma del técnico *</span><div className="relative overflow-hidden rounded-xl border border-gray-200 bg-slate-50"><canvas ref={canvasRef} width={560} height={180} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={endDrawing} onMouseLeave={endDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={endDrawing} className="block h-44 w-full touch-none cursor-crosshair" /><button type="button" onClick={limpiarFirma} className="absolute bottom-2 right-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100">Borrar firma</button></div></div>
            <Textarea value={salida.observaciones} onChange={(value) => setSalida({ ...salida, observaciones: value })} />
            <FormActions onCancel={() => setActiveTabSub('rapido')} submitLabel="Guardar salida" tone="rose" />
          </form>
        </FormCard>
      )}

      {activeTabSub === 'historial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:grid-cols-3"><div className="relative sm:col-span-2"><Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por artículo, documento, usuario o técnico..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-hidden focus:border-amber-500" /></div><select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-hidden focus:border-amber-500"><option value="todos">Todos</option><option value="entrada">Entradas</option><option value="salida">Salidas</option><option value="ajuste">Ajustes</option></select></div>
          <div className="grid gap-3">{movimientosFiltrados.map((mov) => <article key={mov.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs"><div className="flex items-start justify-between gap-3"><div><TipoBadge tipo={mov.tipo} /><h3 className="mt-2 font-black text-gray-900">{mov.articuloNombre}</h3><p className="font-mono text-xs text-gray-400">{mov.codigo}</p><p className="mt-1 text-xs font-semibold text-gray-500">{mov.origenDestino} · {mov.documento || 'Sin documento'} · {new Date(mov.fecha).toLocaleString('es-ES')}</p></div><span className={`rounded-xl px-3 py-2 text-sm font-black ${mov.tipo === 'entrada' ? 'bg-blue-50 text-blue-700' : mov.tipo === 'salida' ? 'bg-rose-50 text-rose-700' : 'bg-purple-50 text-purple-700'}`}>{mov.tipo === 'entrada' ? '+' : mov.tipo === 'salida' ? '-' : ''}{Math.abs(Number(mov.cantidad || 0))}</span></div></article>)}</div>
        </div>
      )}
    </div>
  );
}

function QuickCard({ icon: Icon, title, text, onClick, primary = false }) { return <button onClick={onClick} className={`rounded-3xl p-6 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md ${primary ? 'bg-gray-950 text-white' : 'border border-gray-100 bg-white text-gray-900'}`}><Icon className={`h-8 w-8 ${primary ? 'text-amber-400' : 'text-amber-600'}`} /><h3 className="mt-4 text-xl font-black">{title}</h3><p className={`mt-2 text-sm ${primary ? 'text-gray-300' : 'text-gray-500'}`}>{text}</p></button>; }
function TipoBadge({ tipo }) { const map = { entrada: 'bg-blue-100 text-blue-700', salida: 'bg-rose-100 text-rose-700', ajuste: 'bg-purple-100 text-purple-700' }; return <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${map[tipo] || map.ajuste}`}>{tipo}</span>; }
function FormCard({ title, icon: Icon, tone, children }) { const color = tone === 'blue' ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'; return <div className="mx-auto max-w-4xl rounded-3xl border border-gray-100 bg-white p-6 shadow-xs"><div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4"><span className={`rounded-xl p-2 ${color}`}><Icon className="h-5 w-5" /></span><div><h3 className="text-lg font-black text-gray-900">{title}</h3><p className="text-xs font-semibold text-gray-400">{ALMACEN_NOMBRE}</p></div></div>{children}</div>; }
function ArticuloSelect({ value, onChange, articulos }) { return <label className="block"><span className="label-mini">Artículo *</span><select required value={value} onChange={(event) => onChange(event.target.value)} className="field font-semibold"><option value="">Selecciona un artículo...</option>{articulos.map((art) => <option key={art.id} value={art.id}>{art.codigo} - {art.nombre} ({art.stockActual} {art.unidad}) · {art.ubicacion || 'Sin ubicación'}</option>)}</select></label>; }
function MiniArticulo({ art, stock, danger = false }) { if (!art) return null; return <div className={`rounded-2xl border p-4 ${danger ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'}`}><p className="text-xs font-black uppercase tracking-wider text-gray-400">Artículo seleccionado</p><div className="mt-2 flex items-center justify-between gap-4"><div><h4 className="font-black text-gray-900">{art.nombre}</h4><p className="text-xs font-semibold text-gray-500">{art.categoria} · {art.ubicacion || 'Sin ubicación'} · {art.codigo}</p></div><div className="text-right"><p className={`text-2xl font-black ${danger ? 'text-red-700' : 'text-gray-900'}`}>{stock}</p><p className="text-xs font-bold text-gray-400">{art.unidad}</p></div></div></div>; }
function ReadOnlyLocation() { return <label className="block"><span className="label-mini">Almacén</span><input value={ALMACEN_NOMBRE} readOnly className="field bg-gray-100 font-bold text-gray-500" /></label>; }
function TextField({ label, value, onChange }) { return <label className="block"><span className="label-mini">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="field" /></label>; }
function NumberField({ label, value, onChange }) { return <label className="block"><span className="label-mini">{label} *</span><input required min="1" type="number" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} className="field text-lg font-black" /></label>; }
function Textarea({ value, onChange }) { return <label className="block"><span className="label-mini">Observaciones</span><textarea rows="3" value={value} onChange={(event) => onChange(event.target.value)} className="field resize-none" /></label>; }
function PhotoInput({ label, image, onFile, onClear }) { return <div><span className="label-mini flex items-center gap-1"><Camera className="h-3.5 w-3.5 text-amber-500" /> {label}</span><div className="flex flex-col gap-2 sm:flex-row"><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"><Camera className="h-4 w-4" />Hacer foto<input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" /></label><label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200">Elegir archivo<input type="file" accept="image/*" onChange={onFile} className="hidden" /></label></div>{image && <div className="relative mt-2 w-36 rounded-xl border border-gray-200 bg-gray-50 p-2"><img src={image} alt={label} className="h-24 w-full rounded-lg object-cover" /><button type="button" onClick={onClear} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white"><X className="h-4 w-4" /></button></div>}</div>; }
function FormActions({ onCancel, submitLabel, tone }) { const button = tone === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'; return <div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200">Cancelar</button><button type="submit" className={`rounded-lg px-5 py-3 text-sm font-black text-white ${button}`}>{submitLabel}</button></div>; }
