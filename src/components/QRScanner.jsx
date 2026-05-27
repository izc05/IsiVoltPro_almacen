import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Camera, CheckCircle, ClipboardCheck, Play, Plus, QrCode, RefreshCw, Search, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ALMACEN_ID = 'alm-principal';
const ALMACEN_NOMBRE = 'Almacén principal';

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

  const [modo, setModo] = useState('camara');
  const [cameraActive, setCameraActive] = useState(false);
  const [errorCamera, setErrorCamera] = useState('');
  const [codigoManual, setCodigoManual] = useState('');
  const [articulo, setArticulo] = useState(null);
  const [codigoDetectado, setCodigoDetectado] = useState('');
  const [accion, setAccion] = useState('salida');
  const [cantidad, setCantidad] = useState('1');
  const [tecnico, setTecnico] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [documento, setDocumento] = useState('');
  const [stockFisico, setStockFisico] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [continuo, setContinuo] = useState(true);

  const scannerInstance = useRef(null);
  const tecnicosActivos = tecnicos.filter((t) => t.activo);
  const proveedoresActivos = proveedores;

  const stockActual = articulo ? Number(articulo.stockPorAlmacen?.[ALMACEN_ID] ?? articulo.stockActual) || 0 : 0;

  useEffect(() => {
    if (!tecnico && tecnicosActivos.length) setTecnico(currentUser?.tecnicoNombre || tecnicosActivos[0].nombre);
    if (!proveedor && proveedoresActivos.length) setProveedor(proveedoresActivos[0].nombre);
  }, [tecnicosActivos, proveedoresActivos, tecnico, proveedor, currentUser]);

  useEffect(() => () => detenerCamara(), []);

  const procesarCodigo = (raw) => {
    const code = String(raw || '').trim().toUpperCase();
    if (!code) return;
    const encontrado = articulos.find((art) => art.codigo.trim().toUpperCase() === code || art.qr?.trim().toUpperCase() === code);
    setCodigoDetectado(code);
    setArticulo(encontrado || null);
    setError(encontrado ? '' : 'QR no encontrado. Puedes crear el artículo desde Catálogo.');
    setOk('');
    setCantidad('1');
    setStockFisico('');
    detenerCamara();
    onScanResult?.(code, encontrado || null);
  };

  const iniciarCamara = async () => {
    setModo('camara');
    setErrorCamera('');
    setCameraActive(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('reader');
        scannerInstance.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 18, qrbox: (w, h) => ({ width: Math.min(w, h) * 0.72, height: Math.min(w, h) * 0.72 }) },
          (decodedText) => procesarCodigo(decodedText)
        );
      } catch (err) {
        console.error(err);
        setErrorCamera('No se pudo acceder a la cámara. Revisa permisos o usa código manual.');
        setCameraActive(false);
      }
    }, 120);
  };

  const detenerCamara = () => {
    const scanner = scannerInstance.current;
    if (scanner?.isScanning) {
      scanner.stop().then(() => setCameraActive(false)).catch(() => setCameraActive(false));
    } else {
      setCameraActive(false);
    }
  };

  const listoSiguiente = () => {
    setArticulo(null);
    setCodigoDetectado('');
    setCodigoManual('');
    setCantidad('1');
    setStockFisico('');
    setDocumento('');
    setObservaciones('');
    if (continuo && modo === 'camara') iniciarCamara();
  };

  const guardarOperacion = (event) => {
    event.preventDefault();
    setError('');
    setOk('');
    if (!articulo) {
      setError('Escanea o busca primero un artículo existente.');
      return;
    }

    try {
      if (accion === 'entrada') {
        registrarEntrada(articulo.id, cantidad, { proveedor, documento, observaciones, almacenId: ALMACEN_ID });
        setOk(`Entrada registrada: +${cantidad} ${articulo.unidad} · ${articulo.nombre}`);
      }
      if (accion === 'salida') {
        registrarSalida(articulo.id, cantidad, { tecnico, documento, observaciones, almacenId: ALMACEN_ID });
        setOk(`Salida registrada: -${cantidad} ${articulo.unidad} · ${articulo.nombre}`);
      }
      if (accion === 'recuento') {
        const mov = registrarInventarioAlmacen(articulo.id, stockFisico, observaciones || 'Recuento rápido por QR', ALMACEN_ID);
        setOk(mov ? `Inventario ajustado: ${articulo.nombre}` : 'Inventario correcto. Sin descuadre.');
      }

      if (continuo) setTimeout(listoSiguiente, 900);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`space-y-6 ${inlineMode ? '' : 'mx-auto max-w-6xl'}`}>
      {!inlineMode && (
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Escaneo rápido QR</h2>
            <p className="mt-1 text-sm text-gray-500">Entrada, salida e inventario continuo desde móvil. Solo {ALMACEN_NOMBRE}.</p>
          </div>
          <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-gray-600 shadow-xs border border-gray-100">
            <input type="checkbox" checked={continuo} onChange={(e) => setContinuo(e.target.checked)} className="h-4 w-4 accent-amber-500" />
            Modo continuo
          </label>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          {!articulo && (
            <div className="relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-gray-800 bg-gray-950 p-5 text-white shadow-xl">
              <div className="absolute inset-x-0 top-1/2 z-10 h-1 animate-bounce bg-amber-500/80 shadow-[0_0_15px_#f59e0b]" />
              <QrCode className="h-16 w-16 text-amber-400" />
              <h3 className="mt-4 text-xl font-black">Escanea el producto</h3>
              <p className="mt-2 max-w-sm text-center text-sm text-gray-400">Apunta al QR del artículo. Después elige entrada, salida o recuento.</p>

              {modo === 'camara' && cameraActive && <div id="reader" className="relative z-20 mt-5 w-full max-w-sm overflow-hidden rounded-2xl border border-gray-700 bg-black" />}

              {errorCamera && <div className="relative z-20 mt-4 rounded-xl border border-red-500/20 bg-red-900/35 p-3 text-xs text-red-200">{errorCamera}</div>}

              <div className="relative z-20 mt-6 flex flex-wrap justify-center gap-3">
                {!cameraActive ? (
                  <button onClick={iniciarCamara} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-gray-950 hover:bg-amber-400"><Play className="h-4 w-4 fill-current" /> Activar cámara</button>
                ) : (
                  <button onClick={detenerCamara} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700"><Square className="h-4 w-4 fill-current" /> Detener</button>
                )}
              </div>
            </div>
          )}

          {articulo && <ArticuloCard articulo={articulo} stock={stockActual} onReset={listoSiguiente} />}

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Código manual</h4>
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={codigoManual} onChange={(e) => setCodigoManual(e.target.value.toUpperCase())} placeholder="Ej. ELE-CABLE-25" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 font-mono text-xs outline-hidden focus:border-amber-500" /></div>
              <button onClick={() => procesarCodigo(codigoManual)} className="rounded-xl bg-gray-950 px-4 py-2 text-xs font-black text-white">Buscar</button>
            </div>
            {!articulo && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {articulos.slice(0, 6).map((art) => <button key={art.id} onClick={() => procesarCodigo(art.codigo)} className="truncate rounded-lg border border-gray-100 p-2 text-left text-[10px] font-bold text-gray-600 hover:border-amber-200 hover:bg-amber-50">{art.codigo}</button>)}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs lg:min-h-[520px]">
          {!articulo ? (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center"><Camera className="h-12 w-12 text-gray-300" /><h3 className="mt-4 text-lg font-black text-gray-900">Listo para escanear</h3><p className="mt-1 max-w-sm text-sm text-gray-500">El flujo continuo vuelve automáticamente a la cámara después de guardar.</p>{codigoDetectado && !articulo && <button onClick={() => setActiveTab('articulos')} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-gray-950"><Plus className="h-4 w-4" /> Crear artículo {codigoDetectado}</button>}</div>
          ) : (
            <form onSubmit={guardarOperacion} className="space-y-4">
              {ok && <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-800"><CheckCircle className="h-4 w-4" />{ok}</div>}
              {error && <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700"><AlertTriangle className="h-4 w-4" />{error}</div>}

              <div className="grid grid-cols-3 gap-2">
                <ActionButton active={accion === 'entrada'} icon={ArrowDownLeft} label="Entrada" color="blue" onClick={() => setAccion('entrada')} />
                <ActionButton active={accion === 'salida'} icon={ArrowUpRight} label="Salida" color="rose" onClick={() => setAccion('salida')} />
                <ActionButton active={accion === 'recuento'} icon={ClipboardCheck} label="Inventario" color="amber" onClick={() => setAccion('recuento')} />
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">{ALMACEN_NOMBRE}</p>
                <p className="mt-1 text-sm font-bold text-gray-700">Stock actual: <span className="text-xl font-black text-gray-950">{stockActual}</span> {articulo.unidad}</p>
              </div>

              {accion === 'recuento' ? (
                <NumberInput label="Stock físico real" value={stockFisico} onChange={setStockFisico} min="0" />
              ) : (
                <NumberInput label="Cantidad" value={cantidad} onChange={setCantidad} min="1" />
              )}

              {accion === 'salida' && (
                <label className="block"><span className="label-mini">Técnico</span><select value={tecnico} onChange={(e) => setTecnico(e.target.value)} className="field" required>{tecnicosActivos.map((tec) => <option key={tec.id} value={tec.nombre}>{tec.nombre} · {tec.seccion}</option>)}</select></label>
              )}

              {accion === 'entrada' && (
                <label className="block"><span className="label-mini">Proveedor</span><select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="field"><option value="General">General</option>{proveedoresActivos.map((prov) => <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>)}</select></label>
              )}

              <label className="block"><span className="label-mini">Documento / OT / Albarán</span><input value={documento} onChange={(e) => setDocumento(e.target.value.toUpperCase())} className="field font-mono" placeholder={accion === 'entrada' ? 'ALB-...' : 'OT-...'} /></label>
              <label className="block"><span className="label-mini">Observaciones</span><textarea rows="3" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="field resize-none" /></label>

              <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={listoSiguiente} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600 hover:bg-gray-200"><RefreshCw className="mr-2 inline h-4 w-4" />Siguiente QR</button>
                <button type="submit" className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-black text-gray-950 hover:bg-amber-400">Guardar y continuar</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

function ArticuloCard({ articulo, stock, onReset }) {
  const bajo = stock <= Number(articulo.stockMinimo || 0);
  return <div className={`rounded-3xl border p-5 shadow-xs ${bajo ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-white'}`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Artículo detectado</p><h3 className="mt-1 text-xl font-black text-gray-900">{articulo.nombre}</h3><p className="mt-1 text-xs font-semibold text-gray-500">{articulo.categoria} · {articulo.ubicacion || 'Sin ubicación'} · {articulo.codigo}</p></div><button onClick={onReset} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-black text-gray-600 hover:bg-gray-200">Cambiar</button></div><div className="mt-4 flex items-end justify-between rounded-2xl bg-white/70 p-4"><span className="text-xs font-bold uppercase tracking-wider text-gray-400">Stock</span><span className={`text-3xl font-black ${bajo ? 'text-red-700' : 'text-gray-950'}`}>{stock} <small className="text-sm text-gray-500">{articulo.unidad}</small></span></div></div>;
}

function ActionButton({ active, icon: Icon, label, color, onClick }) {
  const activeClass = color === 'blue' ? 'bg-blue-600 text-white' : color === 'rose' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-gray-950';
  return <button type="button" onClick={onClick} className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-4 text-xs font-black transition ${active ? activeClass : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Icon className="h-5 w-5" />{label}</button>;
}

function NumberInput({ label, value, onChange, min }) {
  return <label className="block"><span className="label-mini">{label}</span><input required min={min} type="number" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} className="field text-2xl font-black" /></label>;
}
