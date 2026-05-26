import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  CheckCircle,
  ClipboardCheck,
  PenTool,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Square
} from 'lucide-react';

const emptyOperacion = {
  almacenId: 'alm-principal',
  cantidad: '',
  documento: '',
  responsable: '',
  observaciones: '',
  stockFisico: '',
  firma: null
};

export default function QRScanner({ onScanResult = null, inlineMode = false }) {
  const {
    articulos,
    almacenes,
    proveedores,
    tecnicos,
    registrarEntrada,
    registrarSalida,
    registrarInventarioAlmacen,
    currentUser,
    setActiveTab
  } = useApp();

  const [codigoEscaneado, setCodigoEscaneado] = useState('');
  const [articuloDetectado, setArticuloDetectado] = useState(null);
  const [escaneadoCompleto, setEscaneadoCompleto] = useState(false);
  const [accion, setAccion] = useState(null);
  const [operacion, setOperacion] = useState(emptyOperacion);
  const [resultado, setResultado] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [modo, setModo] = useState('simulador');
  const [cameraActive, setCameraActive] = useState(false);
  const [errorCamera, setErrorCamera] = useState('');

  const scannerInstance = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  const tecnicosActivos = tecnicos.filter((tec) => tec.activo);
  const articuloDetectadoId = articuloDetectado?.id;
  const articuloActivo = articuloDetectado?.activo !== false;
  const stockAlmacen = articuloDetectado
    ? Number(articuloDetectado.stockPorAlmacen?.[operacion.almacenId]) || 0
    : 0;

  const defaultResponsable = () => {
    if (currentUser?.rol === 'tecnico') return currentUser.tecnicoNombre || currentUser.nombre || '';
    return tecnicosActivos[0]?.nombre || currentUser?.nombre || '';
  };

  const defaultProveedor = () => {
    if (currentUser?.rol === 'tecnico') return currentUser.nombre || currentUser.tecnicoNombre || '';
    return proveedores[0]?.nombre || 'Proveedor general';
  };

  const resetOperacion = (nextAccion = null) => {
    setAccion(nextAccion);
    setErrorForm('');
    setResultado(null);
    setOperacion({
      ...emptyOperacion,
      responsable: nextAccion === 'entrada' ? defaultProveedor() : defaultResponsable()
    });
  };

  const procesarCodigo = (codigo) => {
    const code = codigo.trim().toUpperCase();
    if (!code) return;
    const art = articulos.find((a) => a.codigo.trim().toUpperCase() === code);

    setCodigoEscaneado(code);
    setArticuloDetectado(art || null);
    setEscaneadoCompleto(true);
    resetOperacion(null);
    detenerCamara();

    if (onScanResult) {
      onScanResult(code, art || null);
    }
  };

  const iniciarCamara = async () => {
    setErrorCamera('');
    setCameraActive(true);

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('reader');
        scannerInstance.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          (decodedText) => {
            procesarCodigo(decodedText);
          }
        );
      } catch (err) {
        console.error('Error al iniciar cámara:', err);
        setErrorCamera('No se pudo acceder a la cámara. Revisa los permisos de video.');
        setCameraActive(false);
      }
    }, 100);
  };

  const detenerCamara = () => {
    if (scannerInstance.current && scannerInstance.current.isScanning) {
      scannerInstance.current.stop().then(() => {
        setCameraActive(false);
      }).catch((err) => {
        console.error('Error al detener la cámara:', err);
        setCameraActive(false);
      });
    } else {
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerInstance.current && scannerInstance.current.isScanning) {
        scannerInstance.current.stop().catch((err) => console.error(err));
      }
    };
  }, []);

  useEffect(() => {
    if (!articuloDetectadoId) return;
    const actualizado = articulos.find((art) => art.id === articuloDetectadoId);
    if (actualizado) {
      setArticuloDetectado(actualizado);
    }
  }, [articulos, articuloDetectadoId]);

  useEffect(() => {
    if (accion === 'salida' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      setOperacion((prev) => ({ ...prev, firma: null }));
    }
  }, [accion]);

  const reiniciarEscaner = () => {
    setCodigoEscaneado('');
    setArticuloDetectado(null);
    setEscaneadoCompleto(false);
    resetOperacion(null);
    setErrorCamera('');
    if (modo === 'camara') {
      iniciarCamara();
    }
  };

  const getPointer = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = event.touches?.[0] || event;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top
    };
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
    setOperacion((prev) => ({ ...prev, firma: canvasRef.current.toDataURL('image/png') }));
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setOperacion((prev) => ({ ...prev, firma: null }));
  };

  const guardarOperacion = (event) => {
    event.preventDefault();
    setErrorForm('');
    setResultado(null);

    if (!articuloDetectado || !articuloActivo) {
      setErrorForm('Escanea un artículo activo antes de guardar.');
      return;
    }

    try {
      let mov = null;
      if (accion === 'entrada') {
        mov = registrarEntrada(articuloDetectado.id, operacion.cantidad, {
          proveedor: operacion.responsable || defaultProveedor(),
          documento: operacion.documento,
          observaciones: operacion.observaciones || 'Entrada rápida registrada por QR',
          almacenId: operacion.almacenId
        });
      }

      if (accion === 'salida') {
        if (!operacion.firma) {
          setErrorForm('La firma digital es obligatoria para registrar la retirada.');
          return;
        }
        mov = registrarSalida(articuloDetectado.id, operacion.cantidad, {
          tecnico: operacion.responsable || defaultResponsable(),
          documento: operacion.documento,
          observaciones: operacion.observaciones || 'Salida rápida registrada por QR',
          firma: operacion.firma,
          almacenId: operacion.almacenId
        });
      }

      if (accion === 'recuento') {
        mov = registrarInventarioAlmacen(
          articuloDetectado.id,
          operacion.stockFisico,
          operacion.observaciones || 'Recuento rápido registrado por QR',
          operacion.almacenId
        );
      }

      setResultado({
        accion,
        movimiento: mov,
        mensaje: accion === 'recuento' && !mov
          ? 'Recuento guardado sin descuadre de stock.'
          : 'Operación registrada correctamente.'
      });
      setOperacion({
        ...emptyOperacion,
        responsable: accion === 'entrada' ? defaultProveedor() : defaultResponsable()
      });
      if (accion === 'salida') limpiarFirma();
    } catch (error) {
      setErrorForm(error.message);
    }
  };

  return (
    <div className={`space-y-6 ${inlineMode ? '' : 'mx-auto max-w-6xl'}`}>
      {!inlineMode && (
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">QR rápido</h2>
            <p className="mt-1 text-sm text-gray-500">Escanea una referencia y registra entrada, salida o recuento sin cambiar de pantalla.</p>
          </div>

          <div className="flex self-start rounded-xl bg-gray-100 p-1 sm:self-auto">
            <button
              onClick={() => { setModo('simulador'); detenerCamara(); reiniciarEscaner(); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                modo === 'simulador' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Simulador
            </button>
            <button
              onClick={() => { setModo('camara'); reiniciarEscaner(); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                modo === 'camara' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Cámara real
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-4">
          {!escaneadoCompleto && (
            <div className="relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 text-white shadow-xl">
              {modo === 'camara' ? (
                <div className="flex w-full flex-col items-center justify-center p-4">
                  {errorCamera && (
                    <div className="mb-4 flex max-w-sm items-center gap-2 rounded-xl border border-red-500/20 bg-red-900/35 p-4 text-xs text-red-200">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <span>{errorCamera}</span>
                    </div>
                  )}

                  {!cameraActive ? (
                    <div className="space-y-4 py-8 text-center">
                      <div className="inline-block rounded-full border border-amber-500/20 bg-amber-500/10 p-4 text-amber-500">
                        <Camera className="h-10 w-10 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold">Escaneo con cámara</h3>
                        <p className="mt-1 max-w-xs text-xs text-gray-400">Activa la cámara trasera y apunta al QR de la referencia.</p>
                      </div>
                      <button
                        onClick={iniciarCamara}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-gray-950 shadow-md transition-colors hover:bg-amber-600"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        <span>Activar cámara</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-gray-700 bg-black">
                      <div id="reader" className="w-full overflow-hidden"></div>
                      <button
                        onClick={detenerCamara}
                        className="absolute bottom-4 right-4 rounded-full bg-red-600 p-2 text-white shadow-lg hover:bg-red-700"
                        title="Detener cámara"
                      >
                        <Square className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex h-80 w-full flex-col items-center justify-center p-6">
                  <div className="absolute inset-x-0 top-1/2 z-10 h-1 animate-bounce bg-amber-500/80 shadow-[0_0_15px_#f59e0b]" />
                  <div className="absolute left-8 top-8 h-10 w-10 rounded-tl-lg border-l-4 border-t-4 border-amber-500" />
                  <div className="absolute right-8 top-8 h-10 w-10 rounded-tr-lg border-r-4 border-t-4 border-amber-500" />
                  <div className="absolute bottom-8 left-8 h-10 w-10 rounded-bl-lg border-b-4 border-l-4 border-amber-500" />
                  <div className="absolute bottom-8 right-8 h-10 w-10 rounded-br-lg border-b-4 border-r-4 border-amber-500" />

                  <div className="z-20 flex flex-col items-center space-y-4 text-center">
                    <div className="rounded-full border border-amber-500/20 bg-amber-500/10 p-4 text-amber-500">
                      <Camera className="h-10 w-10 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-base font-bold">Simulación de escáner QR</p>
                      <p className="mt-1 max-w-xs text-xs text-gray-400">Usa los atajos rápidos o escribe el código interno.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {escaneadoCompleto && (
            <ArticuloDetectado
              codigoEscaneado={codigoEscaneado}
              articulo={articuloDetectado}
              stockAlmacen={stockAlmacen}
              almacen={almacenes.find((alm) => alm.id === operacion.almacenId)}
              onAccion={resetOperacion}
              onNuevo={() => setActiveTab('articulos')}
              onReset={reiniciarEscaner}
            />
          )}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Ingresar código manualmente</h4>
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ej. IV-CABLE-01"
                  value={codigoEscaneado}
                  onChange={(event) => setCodigoEscaneado(event.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 font-mono text-xs outline-hidden focus:border-amber-500"
                />
              </div>
              <button
                onClick={() => procesarCodigo(codigoEscaneado)}
                className="rounded-xl bg-gray-950 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-800"
              >
                Buscar
              </button>
            </div>
          </div>

          {modo === 'simulador' && !escaneadoCompleto && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
              <h4 className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-gray-400">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Simulación rápida
              </h4>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {articulos.slice(0, 5).map((art) => (
                  <button
                    key={art.id}
                    onClick={() => procesarCodigo(art.codigo)}
                    className="flex items-center gap-2 truncate rounded-lg border border-gray-100 p-2 text-left text-[10px] font-medium text-gray-700 hover:border-amber-200 hover:bg-amber-50/30"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span className="truncate">{art.codigo}</span>
                  </button>
                ))}
                <button
                  onClick={() => procesarCodigo(`NUEVO-QR-${Math.floor(Math.random() * 10000)}`)}
                  className="truncate rounded-lg border border-dashed border-gray-200 p-2 text-left text-[10px] font-bold text-red-600 hover:border-red-200 hover:bg-red-50/30"
                >
                  Simular QR desconocido
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:min-h-[520px]">
          {!articuloDetectado && (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <QrCode className="h-10 w-10 text-gray-300" />
              <h3 className="mt-4 text-lg font-black text-gray-900">Escanea un artículo</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">Cuando detectemos el QR, aparecerán aquí las operaciones rápidas de almacén.</p>
            </div>
          )}

          {articuloDetectado && !accion && (
            <div className="space-y-4">
              <HeaderOperacion articulo={articuloDetectado} />
              <div className="grid gap-3 sm:grid-cols-3">
                <OperacionButton icon={ArrowDownLeft} tone="blue" title={currentUser?.rol === 'tecnico' ? 'Devolver' : 'Entrada'} text="Sumar material recibido" onClick={() => resetOperacion('entrada')} />
                <OperacionButton icon={ArrowUpRight} tone="rose" title="Salida" text="Retirar por técnico" onClick={() => resetOperacion('salida')} />
                <OperacionButton icon={ClipboardCheck} tone="amber" title="Recuento" text="Corregir stock físico" onClick={() => resetOperacion('recuento')} />
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-xs font-semibold text-amber-900">
                Recomendación: el QR identifica la referencia. La cantidad se indica en cada operación: unidades, metros, cajas o el formato que tenga el artículo.
              </div>
            </div>
          )}

          {articuloDetectado && accion && (
            <form onSubmit={guardarOperacion} className="space-y-4">
              <HeaderOperacion articulo={articuloDetectado} />
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
                <TipoOperacion accion={accion} tecnico={currentUser?.rol === 'tecnico'} />
                <button type="button" onClick={() => resetOperacion(null)} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200">
                  Cambiar operación
                </button>
              </div>

              {errorForm && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  {errorForm}
                </div>
              )}

              {resultado && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                  <CheckCircle className="mt-0.5 h-4 w-4" />
                  <span>{resultado.mensaje}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label={accion === 'salida' ? 'Almacén origen' : accion === 'entrada' ? 'Almacén destino' : 'Almacén a contar'} value={operacion.almacenId} onChange={(value) => setOperacion({ ...operacion, almacenId: value })}>
                  {almacenes.map((almacen) => <option key={almacen.id} value={almacen.id}>{almacen.nombre}</option>)}
                </SelectField>

                {accion === 'recuento' ? (
                  <NumberField label={`Stock físico real (${stockAlmacen} registrado)`} min="0" value={operacion.stockFisico} onChange={(value) => setOperacion({ ...operacion, stockFisico: value })} />
                ) : (
                  <NumberField label={`Cantidad (${stockAlmacen} disponible)`} min="1" value={operacion.cantidad} onChange={(value) => setOperacion({ ...operacion, cantidad: value })} />
                )}
              </div>

              {accion !== 'recuento' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {accion === 'entrada' ? (
                    <SelectField label={currentUser?.rol === 'tecnico' ? 'Devuelve' : 'Proveedor'} value={operacion.responsable} onChange={(value) => setOperacion({ ...operacion, responsable: value })}>
                      <option value={currentUser?.nombre || ''}>{currentUser?.nombre || 'Usuario actual'}</option>
                      {proveedores.map((prov) => <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>)}
                    </SelectField>
                  ) : (
                    <SelectField label="Técnico" value={operacion.responsable} onChange={(value) => setOperacion({ ...operacion, responsable: value })}>
                      <option value="">Selecciona técnico...</option>
                      {tecnicosActivos.map((tec) => <option key={tec.id} value={tec.nombre}>{tec.nombre}</option>)}
                    </SelectField>
                  )}
                  <TextField label={accion === 'entrada' ? 'Albarán / documento' : 'OT / obra'} value={operacion.documento} onChange={(value) => setOperacion({ ...operacion, documento: value.toUpperCase() })} />
                </div>
              )}

              {accion === 'salida' && (
                <div>
                  <span className="label-mini flex items-center gap-1"><PenTool className="h-3.5 w-3.5 text-amber-500" /> Firma del técnico *</span>
                  <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
                    <canvas
                      ref={canvasRef}
                      width={560}
                      height={180}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={endDrawing}
                      onMouseLeave={endDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={endDrawing}
                      className="block h-44 w-full touch-none cursor-crosshair"
                    />
                    <button type="button" onClick={limpiarFirma} className="absolute bottom-2 right-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100">
                      Borrar y repetir
                    </button>
                  </div>
                </div>
              )}

              <label className="block">
                <span className="label-mini">Observaciones</span>
                <textarea
                  rows="3"
                  value={operacion.observaciones}
                  onChange={(event) => setOperacion({ ...operacion, observaciones: event.target.value })}
                  className="field resize-none"
                  placeholder={accion === 'recuento' ? 'Ej. Recuento por estantería, rotura o descuadre...' : 'Notas internas de la operación...'}
                />
              </label>

              <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={reiniciarEscaner} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200">
                  Escanear otro
                </button>
                <button type="submit" className="rounded-lg bg-gray-950 px-5 py-2 text-sm font-bold text-white hover:bg-gray-800">
                  Guardar operación QR
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

function ArticuloDetectado({ codigoEscaneado, articulo, stockAlmacen, almacen, onAccion, onNuevo, onReset }) {
  return (
    <div className="animate-scale-up rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className={`rounded-xl p-3 ${articulo ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
          <QrCode className="h-6 w-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-400">Código detectado</span>
          <h3 className="mt-0.5 font-mono text-lg font-extrabold text-gray-900">{codigoEscaneado}</h3>
        </div>
      </div>

      {articulo ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <span className="text-[10px] font-bold uppercase text-gray-400">Artículo encontrado</span>
            <h4 className="mt-0.5 text-base font-extrabold text-gray-900">{articulo.nombre}</h4>
            <p className="mt-1 text-xs text-gray-500">{articulo.marca} {articulo.modelo}</p>
            <div className="mt-3 grid gap-2 text-xs font-semibold text-gray-600">
              <p>Stock total: <strong>{articulo.stockActual} {articulo.unidad}</strong></p>
              <p>Stock en {almacen?.nombre || 'almacén'}: <strong>{stockAlmacen} {articulo.unidad}</strong></p>
              <p>Ubicación: <strong className="font-mono">{articulo.ubicacion || 'S/U'}</strong></p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => onAccion('entrada')} className="rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-700 hover:bg-blue-100">
              Entrada
            </button>
            <button onClick={() => onAccion('salida')} className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 hover:bg-rose-100">
              Salida
            </button>
            <button onClick={() => onAccion('recuento')} className="rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-700 hover:bg-amber-100">
              Recuento
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-red-500" />
            <h4 className="mt-2 text-sm font-bold text-red-900">Artículo no registrado</h4>
            <p className="mx-auto mt-1 max-w-xs text-xs text-red-600">No hay ninguna referencia con este código QR.</p>
          </div>
          <button onClick={onNuevo} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 p-3.5 text-sm font-bold text-white hover:bg-amber-600">
            <Plus className="h-5 w-5" />
            Crear artículo con este código
          </button>
        </div>
      )}

      <button onClick={onReset} className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50">
        Escanear otro código
      </button>
    </div>
  );
}

function HeaderOperacion({ articulo }) {
  return (
    <div className="flex items-start gap-3">
      {articulo.foto ? (
        <img src={articulo.foto} alt={articulo.nombre} className="h-16 w-16 rounded-xl border border-gray-100 bg-gray-50 object-contain p-1" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-300">
          <QrCode className="h-7 w-7" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs font-bold text-amber-600">{articulo.codigo}</p>
        <h3 className="mt-0.5 text-lg font-black leading-tight text-gray-900">{articulo.nombre}</h3>
        <p className="mt-1 text-xs font-semibold text-gray-400">{articulo.categoria} · {articulo.unidad}</p>
      </div>
    </div>
  );
}

function OperacionButton({ icon: Icon, tone, title, text, onClick }) {
  const styles = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100',
    rose: 'border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100',
    amber: 'border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100'
  };
  return (
    <button type="button" onClick={onClick} className={`rounded-xl border p-4 text-left transition-colors ${styles[tone]}`}>
      <Icon className="h-5 w-5" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-0.5 text-xs font-semibold opacity-75">{text}</p>
    </button>
  );
}

function TipoOperacion({ accion, tecnico }) {
  const labels = {
    entrada: tecnico ? 'Devolución rápida por QR' : 'Entrada rápida por QR',
    salida: 'Salida rápida por QR',
    recuento: 'Recuento rápido por QR'
  };
  const icons = {
    entrada: ArrowDownLeft,
    salida: ArrowUpRight,
    recuento: Settings
  };
  const Icon = icons[accion] || RefreshCw;
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-xl bg-gray-950 p-2 text-white"><Icon className="h-4 w-4" /></span>
      <h3 className="text-lg font-black text-gray-900">{labels[accion]}</h3>
    </div>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="label-mini">{label} *</span>
      <select required value={value} onChange={(event) => onChange(event.target.value)} className="field font-semibold">
        {children}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange, min }) {
  return (
    <label className="block">
      <span className="label-mini">{label} *</span>
      <input required min={min} type="number" value={value} onChange={(event) => onChange(event.target.value)} className="field" />
    </label>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="label-mini">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="field font-mono" />
    </label>
  );
}
