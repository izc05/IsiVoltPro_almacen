import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Settings, 
  Eye, 
  AlertTriangle, 
  Sparkles,
  Camera,
  RefreshCw,
  Plus,
  Play,
  Square
} from 'lucide-react';

export default function QRScanner({ onScanResult = null, inlineMode = false }) {
  const { articulos, setActiveTab } = useApp();
  const [codigoEscaneado, setCodigoEscaneado] = useState('');
  const [articuloDetectado, setArticuloDetectado] = useState(null);
  const [escaneadoCompleto, setEscaneadoCompleto] = useState(false);
  
  // Modos: 'simulador' o 'camara'
  const [modo, setModo] = useState('simulador');
  const [cameraActive, setCameraActive] = useState(false);
  const [errorCamera, setErrorCamera] = useState('');
  
  const qrRef = useRef(null);
  const scannerInstance = useRef(null);

  const procesarCodigo = (codigo) => {
    const code = codigo.trim().toUpperCase();
    setCodigoEscaneado(code);
    
    const art = articulos.find(a => a.codigo.trim().toUpperCase() === code);
    if (art) {
      setArticuloDetectado(art);
    } else {
      setArticuloDetectado(null);
    }
    setEscaneadoCompleto(true);
    detenerCamara();

    if (onScanResult) {
      onScanResult(code, art);
    }
  };

  const iniciarCamara = async () => {
    setErrorCamera('');
    setCameraActive(true);
    
    // Esperar a que renderice el elemento #reader
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerInstance.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" }, 
          {
            fps: 15,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          (decodedText) => {
            procesarCodigo(decodedText);
          },
          (errorMessage) => {
            // Ignorar errores normales de frames sin QR
          }
        );
      } catch (err) {
        console.error("Error al iniciar cámara:", err);
        setErrorCamera("No se pudo acceder a la cámara. Asegúrate de dar permisos de video.");
        setCameraActive(false);
      }
    }, 100);
  };

  const detenerCamara = () => {
    if (scannerInstance.current && scannerInstance.current.isScanning) {
      scannerInstance.current.stop().then(() => {
        setCameraActive(false);
      }).catch(err => {
        console.error("Error al detener la cámara:", err);
        setCameraActive(false);
      });
    } else {
      setCameraActive(false);
    }
  };

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (scannerInstance.current && scannerInstance.current.isScanning) {
        scannerInstance.current.stop().catch(err => console.error(err));
      }
    };
  }, []);

  const reiniciarEscaner = () => {
    setCodigoEscaneado('');
    setArticuloDetectado(null);
    setEscaneadoCompleto(false);
    setErrorCamera('');
    if (modo === 'camara') {
      iniciarCamara();
    }
  };

  return (
    <div className={`space-y-6 ${inlineMode ? '' : 'max-w-xl mx-auto'}`}>
      
      {!inlineMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Escáner QR</h2>
            <p className="text-gray-500 text-sm mt-1">Busca artículos al instante enfocando su código QR o ingresándolo manualmente.</p>
          </div>
          
          {/* Selector de modo */}
          <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-auto no-print">
            <button
              onClick={() => { setModo('simulador'); detenerCamara(); reiniciarEscaner(); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                modo === 'simulador' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Simulador
            </button>
            <button
              onClick={() => { setModo('camara'); reiniciarEscaner(); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                modo === 'camara' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Cámara Real
            </button>
          </div>
        </div>
      )}

      {/* RECUADRO DE CÁMARA REAL / SIMULADOR */}
      {!escaneadoCompleto && (
        <div className="bg-gray-950 rounded-2xl overflow-hidden relative shadow-xl border border-gray-800 text-white flex flex-col items-center justify-center min-h-[320px]">
          
          {modo === 'camara' ? (
            // Visor de Cámara Real
            <div className="w-full flex flex-col items-center justify-center p-4">
              {errorCamera && (
                <div className="p-4 bg-red-900/35 border border-red-500/20 text-red-200 text-xs rounded-xl flex items-center space-x-2 max-w-sm mb-4">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <span>{errorCamera}</span>
                </div>
              )}

              {!cameraActive ? (
                <div className="text-center space-y-4 py-8">
                  <div className="p-4 bg-amber-500/10 rounded-full text-amber-500 border border-amber-500/20 inline-block">
                    <Camera className="h-10 w-10 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Acceso a Cámara</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">Haz clic abajo para encender la cámara trasera del dispositivo.</p>
                  </div>
                  <button
                    onClick={iniciarCamara}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-950 rounded-xl text-xs font-bold transition-colors inline-flex items-center space-x-1.5 shadow-md"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Activar Cámara</span>
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-sm rounded-xl overflow-hidden relative border border-gray-700 bg-black">
                  <div id="reader" className="w-full overflow-hidden"></div>
                  
                  <button
                    onClick={detenerCamara}
                    className="absolute bottom-4 right-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg"
                    title="Detener cámara"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Visor de Simulador
            <div className="flex flex-col items-center justify-center p-6 h-80 w-full relative">
              {/* Luz de escaneo láser */}
              <div className="absolute inset-x-0 top-1/2 h-1 bg-amber-500/80 shadow-[0_0_15px_#f59e0b] animate-bounce z-10" />

              {/* Esquinas del objetivo de la cámara */}
              <div className="absolute top-8 left-8 w-10 h-10 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
              <div className="absolute top-8 right-8 w-10 h-10 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
              <div className="absolute bottom-8 left-8 w-10 h-10 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
              <div className="absolute bottom-8 right-8 w-10 h-10 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />

              <div className="flex flex-col items-center space-y-4 text-center z-20">
                <div className="p-4 bg-amber-500/10 rounded-full text-amber-500 border border-amber-500/20">
                  <Camera className="h-10 w-10 animate-pulse" />
                </div>
                <div>
                  <p className="text-base font-bold">Simulación de Escáner QR</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">Selecciona un código de los atajos rápidos para simular una detección.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ACCIONES RÁPIDAS LUEGO DE LECTURA */}
      {escaneadoCompleto && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 animate-scale-up space-y-6">
          <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
            <div className={`p-3 rounded-xl ${articuloDetectado ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400">Código QR Detectado</span>
              <h3 className="font-extrabold text-lg text-gray-900 font-mono mt-0.5">{codigoEscaneado}</h3>
            </div>
          </div>

          {articuloDetectado ? (
            <div className="space-y-4">
              {/* Información básica */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400">Artículo Encontrado</span>
                <h4 className="font-extrabold text-gray-900 text-base mt-0.5">{articuloDetectado.nombre}</h4>
                <p className="text-xs text-gray-500 mt-1">{articuloDetectado.marca} {articuloDetectado.modelo}</p>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-gray-400 font-semibold">Stock Disponible:</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {articuloDetectado.stockActual} {articuloDetectado.unidad}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-400 font-semibold">Ubicación:</span>
                  <span className="font-mono bg-amber-50 px-2 py-0.5 rounded text-amber-900 font-bold">
                    {articuloDetectado.ubicacion || 'S/U'}
                  </span>
                </div>
              </div>

              {/* Botones de Acciones Rápidas */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('articulos')}
                  className="flex items-center justify-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver Ficha</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('movimientos')}
                  className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all"
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  <span>Registrar Entrada</span>
                </button>

                <button
                  onClick={() => setActiveTab('movimientos')}
                  className="flex items-center justify-center space-x-2 p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Registrar Salida</span>
                </button>

                <button
                  onClick={() => setActiveTab('inventario')}
                  className="flex items-center justify-center space-x-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Settings className="h-4 w-4" />
                  <span>Hacer Inventario</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center space-y-2">
                <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
                <h4 className="font-bold text-red-900 text-sm">Artículo No Registrado</h4>
                <p className="text-xs text-red-600 max-w-xs mx-auto">No existe ningún artículo en el inventario con este código de etiqueta QR.</p>
              </div>
              <button
                onClick={() => setActiveTab('articulos')}
                className="w-full flex items-center justify-center space-x-2 p-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Crear nuevo artículo con código: {codigoEscaneado}</span>
              </button>
            </div>
          )}

          <button
            onClick={reiniciarEscaner}
            className="w-full py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors uppercase tracking-wider"
          >
            Escanear Otro Código
          </button>
        </div>
      )}

      {/* CARGA MANUAL DE CÓDIGOS (FALLBACK) */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-4 no-print">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Ingresar código manualmente</h4>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Escribe código interno... Ej. IV-CABLE-01"
              value={codigoEscaneado}
              onChange={(e) => setCodigoEscaneado(e.target.value.toUpperCase())}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden font-mono"
            />
          </div>
          <button
            onClick={() => procesarCodigo(codigoEscaneado)}
            className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* ARTÍCULOS DEMO RÁPIDOS PARA SIMULAR */}
      {modo === 'simulador' && !escaneadoCompleto && (
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-3 no-print">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" />
            <span>Simulación de escaneo rápido</span>
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {articulos.slice(0, 4).map(art => (
              <button
                key={art.id}
                onClick={() => procesarCodigo(art.codigo)}
                className="p-2 border border-gray-100 hover:border-amber-200 hover:bg-amber-50/20 text-[10px] text-gray-700 text-left rounded-lg truncate font-medium flex items-center space-x-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="truncate">{art.codigo}</span>
              </button>
            ))}
            <button
              onClick={() => procesarCodigo(`NUEVO-QR-${Math.floor(Math.random() * 10000)}`)}
              className="p-2 border border-dashed border-gray-200 hover:border-red-200 hover:bg-red-50/20 text-[10px] text-red-600 text-left rounded-lg truncate font-bold"
            >
              Simular QR Desconocido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
