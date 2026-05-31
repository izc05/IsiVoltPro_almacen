import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Camera, CheckCircle, ClipboardCheck, Plus, QrCode, RefreshCw, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { searchService } from '../services/searchService';

const ALMACEN_ID = 'alm-principal';
const ALMACEN_NOMBRE = 'Almacén principal';

const normalizeCode = (value = '') => String(value).trim().toUpperCase();

function matchArticuloPorCodigo(articulos, code) {
  const limpio = normalizeCode(code);
  return articulos.find((art) => [art.codigo, art.qr, art.codigoBarras, art.ean, art.codigoFabricante]
    .filter(Boolean)
    .some((valor) => normalizeCode(valor) === limpio));
}

export default function QRScanner({ onScanResult = null, inlineMode = false }) {
  const {
    articulos,
    proveedores,
    tecnicos,
    registrarEntrada,
    registrarSalida,
    registrarInventarioAlmacen,
    currentUser,
    setActiveTab
  } = useApp();

  const [codigoManual, setCodigoManual] = useState('');
  const [articulo, setArticulo] = useState(null);
  const [codigoDetectado, setCodigoDetectado] = useState('');
  const [accion, setAccion] = useState('salida');
  const [cantidad, setCantidad] = useState('1');
  const [tecnico, setTecnico] = useState(currentUser?.tecnicoNombre || tecnicos.find((t) => t.activo)?.nombre || '');
  const [proveedor, setProveedor] = useState(proveedores[0]?.nombre || 'General');
  const [documento, setDocumento] = useState('');
  const [stockFisico, setStockFisico] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [continuo, setContinuo] = useState(true);
  const [scannerState, setScannerState] = useState('idle');
  const [cameraError, setCameraError] = useState('');

  const reactId = useId();
  const scannerId = useMemo(() => `qr-reader-${reactId.replace(/:/g, '')}`, [reactId]);
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ code: '', at: 0 });
  const tecnicosActivos = tecnicos.filter((t) => t.activo);
  const stockActual = articulo ? Number(articulo.stockPorAlmacen?.[ALMACEN_ID] ?? articulo.stockActual) || 0 : 0;
  const articulosActivos = useMemo(() => articulos.filter((art) => art.activo), [articulos]);
  const articulosRapidos = useMemo(() => {
    const resultados = searchService.sortByRelevance(
      searchService.filterArticles(articulosActivos, { busqueda: codigoManual, mostrarInactivos: false }),
      codigoManual
    );
    return resultados.slice(0, codigoManual.trim() ? 8 : 10);
  }, [articulosActivos, codigoManual]);

  useEffect(() => () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    scanner.stop?.().catch(() => {}).finally(() => scanner.clear?.().catch(() => {}));
  }, []);

  const procesarCodigo = (raw) => {
    const code = normalizeCode(raw);
    if (!code) return;
    const encontrado = matchArticuloPorCodigo(articulos, code);
    setCodigoDetectado(code);
    setArticulo(encontrado || null);
    setError(encontrado ? '' : 'Código no registrado. Puedes crear el artículo y guardar este código de barras.');
    setOk('');
    setCantidad('1');
    setStockFisico('');
    onScanResult?.(code, encontrado || null);
  };

  const stopCamera = async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setScannerState('idle');
      return;
    }
    try {
      await scanner.stop();
    } catch {
      // Puede estar ya parado si el navegador cortó el permiso de cámara.
    }
    try {
      await scanner.clear();
    } catch {
      // No bloquea el uso manual si la limpieza del visor falla.
    }
    scannerRef.current = null;
    setScannerState('idle');
  };

  const startCamera = async () => {
    if (scannerState === 'starting' || scannerState === 'scanning') return;
    setCameraError('');
    setError('');

    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      setCameraError('La cámara sólo funciona en HTTPS o en local. Usa GitHub Pages o el código manual.');
      return;
    }

    try {
      setScannerState('starting');
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(scannerId, false);
      scannerRef.current = scanner;

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF
      ].filter(Boolean);

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 260, height: 180 }, aspectRatio: 1.333, formatsToSupport },
        (decodedText) => {
          const code = normalizeCode(decodedText);
          const now = Date.now();
          if (!code || (lastScanRef.current.code === code && now - lastScanRef.current.at < 1800)) return;
          lastScanRef.current = { code, at: now };
          procesarCodigo(code);
          if (!continuo) stopCamera();
        },
        () => {}
      );
      setScannerState('scanning');
    } catch (err) {
      scannerRef.current = null;
      setScannerState('idle');
      setCameraError(err?.message || 'No se pudo iniciar la cámara. Revisa permisos o usa el código manual.');
    }
  };

  const listoSiguiente = () => {
    setArticulo(null); setCodigoDetectado(''); setCodigoManual(''); setCantidad('1'); setStockFisico(''); setDocumento(''); setObservaciones(''); setOk(''); setError('');
  };

  const guardarOperacion = (event) => {
    event.preventDefault();
    setError(''); setOk('');
    if (!articulo) return setError('Escanea o busca primero un artículo existente.');
    try {
      if (accion === 'entrada') { registrarEntrada(articulo.id, cantidad, { proveedor, documento, observaciones, almacenId: ALMACEN_ID }); setOk(`Entrada registrada: +${cantidad} ${articulo.unidad} · ${articulo.nombre}`); }
      if (accion === 'salida') { registrarSalida(articulo.id, cantidad, { tecnico, documento, observaciones, almacenId: ALMACEN_ID }); setOk(`Salida registrada: ${cantidad} ${articulo.unidad} retiradas · ${articulo.nombre}`); }
      if (accion === 'recuento') { const mov = registrarInventarioAlmacen(articulo.id, stockFisico, observaciones || 'Recuento rápido por QR/código de barras', ALMACEN_ID); setOk(mov ? `Inventario ajustado: ${articulo.nombre}` : 'Inventario correcto. Sin descuadre.'); }
      if (continuo) setTimeout(listoSiguiente, 800);
    } catch (err) { setError(err.message || 'No se pudo guardar la operación.'); }
  };

  return (
    <div className={`space-y-6 ${inlineMode ? '' : 'mx-auto max-w-6xl'}`}>
      {!inlineMode && <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Escaneo rápido QR / código de barras</h2><p className="mt-1 text-sm text-gray-500">Lee QR interno, EAN, UPC o Code128 del fabricante. Solo {ALMACEN_NOMBRE}.</p></div><label className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs font-black text-gray-600 shadow-xs"><input type="checkbox" checked={continuo} onChange={(e) => setContinuo(e.target.checked)} className="h-4 w-4 accent-amber-500" />Modo continuo</label></div>}
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          {!articulo && <div className="relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-gray-800 bg-gray-950 p-5 text-white shadow-xl">{scannerState === 'scanning' && <div className="pointer-events-none absolute inset-x-8 top-1/2 z-10 h-1 animate-bounce bg-amber-500/80 shadow-[0_0_15px_#f59e0b]" />}<div id={scannerId} className={`relative z-0 min-h-64 w-full max-w-sm overflow-hidden rounded-2xl bg-gray-900 ${scannerState === 'scanning' ? 'border border-amber-400/40' : ''}`} />{scannerState !== 'scanning' && <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"><QrCode className="h-16 w-16 text-amber-400" /><h3 className="mt-4 text-xl font-black">Escanea QR o código de barras</h3><p className="mt-2 max-w-sm text-sm text-gray-400">Sirve para productos con EAN/UPC del fabricante o etiquetas QR propias.</p></div>}<div className="relative z-20 mt-5 flex flex-wrap justify-center gap-2">{scannerState === 'scanning' ? <button onClick={stopCamera} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-black text-gray-950"><X className="h-4 w-4" /> Parar cámara</button> : <button onClick={startCamera} disabled={scannerState === 'starting'} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-gray-950 disabled:opacity-60"><Camera className="h-4 w-4" /> {scannerState === 'starting' ? 'Abriendo cámara...' : 'Escanear con cámara'}</button>}</div>{cameraError && <p className="relative z-20 mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-center text-xs font-bold text-red-100">{cameraError}</p>}</div>}
          {articulo && <ArticuloCard articulo={articulo} stock={stockActual} onReset={listoSiguiente} />}
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs"><h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Código manual / EAN</h4><div className="mt-4 flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={codigoManual} onChange={(e) => setCodigoManual(e.target.value.toUpperCase())} placeholder="Ej. ELE-CABLE-25 o 8431234567890" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 font-mono text-xs outline-none focus:border-amber-500" /></div><button onClick={() => procesarCodigo(codigoManual)} className="rounded-xl bg-gray-950 px-4 py-2 text-xs font-black text-white">Buscar</button></div>{!articulo && <div className="mt-3 grid grid-cols-2 gap-2">{articulosRapidos.map((art) => <button key={art.id} onClick={() => procesarCodigo(art.codigo)} className="truncate rounded-lg border border-gray-100 p-2 text-left text-[10px] font-bold text-gray-600 hover:border-amber-200 hover:bg-amber-50"><span className="block truncate font-mono text-gray-900">{art.codigo}</span><span className="block truncate text-gray-400">{art.codigoBarras || art.ean || 'sin EAN'} · {art.nombre}</span></button>)}</div>}</div>
        </section>
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs lg:min-h-[520px]">{!articulo ? <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center"><Camera className="h-12 w-12 text-gray-300" /><h3 className="mt-4 text-lg font-black text-gray-900">Listo para registrar</h3><p className="mt-1 max-w-sm text-sm text-gray-500">Escanea QR interno o código de barras del fabricante.</p>{codigoDetectado && !articulo && <button onClick={() => setActiveTab('articulos')} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-gray-950"><Plus className="h-4 w-4" /> Crear artículo {codigoDetectado}</button>}</div> : <form onSubmit={guardarOperacion} className="space-y-4">{ok && <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-800"><CheckCircle className="h-4 w-4" />{ok}</div>}{error && <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700"><AlertTriangle className="h-4 w-4" />{error}</div>}<div className="grid grid-cols-3 gap-2"><ActionButton active={accion === 'entrada'} icon={ArrowDownLeft} label="Entrada" color="blue" onClick={() => setAccion('entrada')} /><ActionButton active={accion === 'salida'} icon={ArrowUpRight} label="Salida" color="rose" onClick={() => setAccion('salida')} /><ActionButton active={accion === 'recuento'} icon={ClipboardCheck} label="Inventario" color="amber" onClick={() => setAccion('recuento')} /></div><div className="rounded-2xl border border-gray-100 bg-gray-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-gray-400">{ALMACEN_NOMBRE}</p><p className="mt-1 text-sm font-bold text-gray-700">Stock actual: <span className="text-xl font-black text-gray-950">{stockActual}</span> {articulo.unidad}</p></div>{accion === 'recuento' ? <NumberInput label="Stock físico real" value={stockFisico} onChange={setStockFisico} min="0" /> : <NumberInput label="Cantidad" value={cantidad} onChange={setCantidad} min="1" />}{accion === 'salida' && <label className="block"><span className="label-mini">Técnico</span><select value={tecnico} onChange={(e) => setTecnico(e.target.value)} className="field" required>{tecnicosActivos.map((tec) => <option key={tec.id} value={tec.nombre}>{tec.nombre} · {tec.seccion}</option>)}</select></label>}{accion === 'entrada' && <label className="block"><span className="label-mini">Proveedor</span><select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="field"><option value="General">General</option>{proveedores.map((prov) => <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>)}</select></label>}<label className="block"><span className="label-mini">Documento / OT / Albarán</span><input value={documento} onChange={(e) => setDocumento(e.target.value.toUpperCase())} className="field font-mono" placeholder={accion === 'entrada' ? 'ALB-...' : 'OT-...'} /></label><label className="block"><span className="label-mini">Observaciones</span><textarea rows="3" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="field resize-none" /></label><div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={listoSiguiente} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600 hover:bg-gray-200"><RefreshCw className="mr-2 inline h-4 w-4" />Siguiente</button><button type="submit" className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-black text-gray-950 hover:bg-amber-400">Guardar</button></div></form>}</section>
      </div>
    </div>
  );
}

function ArticuloCard({ articulo, stock, onReset }) {
  const bajo = stock <= Number(articulo.stockMinimo || 0);
  return <div className={`rounded-3xl border p-5 shadow-xs ${bajo ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-white'}`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Artículo detectado</p><h3 className="mt-1 text-xl font-black text-gray-900">{articulo.nombre}</h3><p className="mt-1 text-xs font-semibold text-gray-500">{articulo.categoria} · {articulo.ubicacion || 'Sin ubicación'} · {articulo.codigo}</p>{(articulo.codigoBarras || articulo.ean) && <p className="mt-1 font-mono text-xs font-bold text-amber-600">EAN: {articulo.codigoBarras || articulo.ean}</p>}</div><button onClick={onReset} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-black text-gray-600 hover:bg-gray-200">Cambiar</button></div><div className="mt-4 flex items-end justify-between rounded-2xl bg-white/70 p-4"><span className="text-xs font-bold uppercase tracking-wider text-gray-400">Stock</span><span className={`text-3xl font-black ${bajo ? 'text-red-700' : 'text-gray-950'}`}>{stock} <small className="text-sm text-gray-500">{articulo.unidad}</small></span></div></div>;
}

function ActionButton({ active, icon: Icon, label, color, onClick }) { const activeClass = color === 'blue' ? 'bg-blue-600 text-white' : color === 'rose' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-gray-950'; return <button type="button" onClick={onClick} className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-4 text-xs font-black transition ${active ? activeClass : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Icon className="h-5 w-5" />{label}</button>; }
function NumberInput({ label, value, onChange, min }) { return <label className="block"><span className="label-mini">{label}</span><input required min={min} type="number" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} className="field text-2xl font-black" /></label>; }
