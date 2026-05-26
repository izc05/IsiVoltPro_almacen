import { useApp } from '../context/AppContext';
import { 
  Package, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  QrCode, 
  UserCheck,
  ShoppingBag,
  History
} from 'lucide-react';
export default function Dashboard() {
  const { 
    articulos, 
    almacenes,
    movimientos, 
    setActiveTab, 
    generarPedidoAutomatico,
    hasPermission
  } = useApp();

  // 1. Cálculos de métricas
  const totalArticulos = articulos.filter(a => a.activo).length;
  const stockBajo = articulos.filter(a => a.activo && a.stockActual <= a.stockMinimo);
  const unidadesTotales = articulos
    .filter(a => a.activo)
    .reduce((sum, art) => sum + (Number(art.stockActual) || 0), 0);

  // Filtrar movimientos de este mes
  const ahora = new Date();
  const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const movMes = movimientos.filter(m => new Date(m.fecha) >= primerDiaMes);
  
  const entradasMes = movMes
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + m.cantidad, 0);

  const salidasMes = movMes
    .filter(m => m.tipo === 'salida')
    .reduce((sum, m) => sum + m.cantidad, 0);

  const resumenAlmacenes = almacenes.map((almacen) => {
    const articulosConStock = articulos.filter((art) => art.activo && (Number(art.stockPorAlmacen?.[almacen.id]) || 0) > 0);
    const unidades = articulosConStock.reduce((sum, art) => sum + (Number(art.stockPorAlmacen?.[almacen.id]) || 0), 0);
    const alertas = articulosConStock.filter((art) => (Number(art.stockPorAlmacen?.[almacen.id]) || 0) <= art.stockMinimo).length;

    return {
      ...almacen,
      articulos: articulosConStock.length,
      unidades,
      alertas
    };
  });

  // 2. Análisis de movimientos (Materiales más retirados y Técnicos con más salidas)
  const rankingMateriales = {};
  const rankingTecnicos = {};

  movimientos.forEach(m => {
    if (m.tipo === 'salida') {
      // Material
      rankingMateriales[m.articuloNombre] = (rankingMateriales[m.articuloNombre] || 0) + m.cantidad;
      // Técnico
      rankingTecnicos[m.origenDestino] = (rankingTecnicos[m.origenDestino] || 0) + m.cantidad;
    }
  });

  const materialesMasRetirados = Object.entries(rankingMateriales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const tecnicosMasActivos = Object.entries(rankingTecnicos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Título de Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Panel Principal</h2>
          <p className="text-gray-500 text-sm mt-1">Resumen del estado y actividad de IsiVoltPro Almacén.</p>
        </div>
        <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-xl shadow-xs border border-gray-100 self-start md:self-auto">
          Fecha Local: {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* METRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
        
        {/* Total Artículos */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col gap-3">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Artículos Totales</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{totalArticulos}</h3>
          </div>
        </div>

        {/* Stock Bajo Mínimo */}
        <div
          onClick={() => setActiveTab('articulos')}
          className={`p-5 rounded-2xl shadow-xs border flex flex-col gap-3 cursor-pointer transition-transform hover:scale-[1.02] ${
            stockBajo.length > 0 
              ? 'bg-red-50/50 border-red-100 text-red-900' 
              : 'bg-white border-gray-100 text-gray-900'
          }`}
        >
          <div className={`p-3 rounded-xl ${stockBajo.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock Bajo Mínimo</p>
            <h3 className={`text-2xl font-black mt-1 ${stockBajo.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {stockBajo.length}
            </h3>
          </div>
        </div>

        {/* Entradas del Mes */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col gap-3">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Entradas (Este Mes)</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">+{entradasMes}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col gap-3">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Salidas (Este Mes)</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">-{salidasMes}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col gap-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unidades Totales</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{unidadesTotales}</h3>
          </div>
        </div>

      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Stock por Almacén</h3>
            <p className="text-xs text-gray-500 mt-0.5">Resumen rápido de unidades, referencias activas y alertas por ubicación.</p>
          </div>
          <button
            onClick={() => setActiveTab('articulos')}
            className="self-start sm:self-auto text-xs font-bold text-amber-600 hover:text-amber-700"
          >
            Ver catálogo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {resumenAlmacenes.map((almacen) => (
            <div key={almacen.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-gray-900">{almacen.nombre}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-400">{almacen.articulos} referencias con stock</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-black ${
                  almacen.alertas > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {almacen.alertas} alertas
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Unidades</span>
                <span className="text-2xl font-black text-gray-900">{almacen.unidades}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <button 
            onClick={() => setActiveTab('inventario')}
            className="flex flex-col items-center justify-center p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-xs transition-colors space-y-2 text-center"
          >
            <QrCode className="h-6 w-6" />
            <span className="text-sm">Escanear QR / Recuento</span>
          </button>

          <button 
            onClick={() => setActiveTab('movimientos')}
            className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-xs transition-colors space-y-2 text-center"
          >
            <ArrowDownLeft className="h-6 w-6 text-amber-500" />
            <span className="text-sm">Nueva Entrada</span>
          </button>

          <button 
            onClick={() => setActiveTab('movimientos')}
            className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-xs transition-colors space-y-2 text-center"
          >
            <ArrowUpRight className="h-6 w-6 text-amber-500" />
            <span className="text-sm">Nueva Salida</span>
          </button>

          {hasPermission('pedidos') && (
            <button
              onClick={generarPedidoAutomatico}
              className="flex flex-col items-center justify-center p-4 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-xl font-semibold shadow-xs transition-colors space-y-2 text-center"
            >
              <ShoppingBag className="h-6 w-6 text-amber-600" />
              <span className="text-sm">Pedido Automático</span>
            </button>
          )}

        </div>
      </div>

      {/* DETALLES DE INVENTARIO Y MOVIMIENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ÚLTIMOS MOVIMIENTOS */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <History className="h-5 w-5 text-gray-500" />
                <span>Últimos Movimientos</span>
              </h3>
              <button 
                onClick={() => setActiveTab('movimientos')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                Ver todos
              </button>
            </div>
            
            <div className="space-y-3">
              {movimientos.slice(0, 5).map((mov) => (
                <div key={mov.id} className="flex items-start justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start space-x-3">
                    <span className={`p-1.5 rounded-lg mt-0.5 inline-block ${
                      mov.tipo === 'entrada' 
                        ? 'bg-blue-100 text-blue-700' 
                        : mov.tipo === 'salida' 
                        ? 'bg-rose-100 text-rose-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {mov.tipo === 'entrada' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{mov.articuloNombre}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {mov.origenDestino} • {new Date(mov.fecha).toLocaleDateString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-sm ${
                      mov.tipo === 'entrada' ? 'text-blue-600' : mov.tipo === 'salida' ? 'text-rose-600' : 'text-purple-600'
                    }`}>
                      {mov.tipo === 'entrada' ? '+' : ''}{mov.cantidad}
                    </span>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{mov.codigo}</p>
                  </div>
                </div>
              ))}
              {movimientos.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">No hay movimientos registrados.</p>
              )}
            </div>
          </div>
        </div>

        {/* RANKINGS DE USO Y CONSUMOS */}
        <div className="grid grid-cols-1 gap-6">
          
          {/* Material más retirado */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <span>Materiales Más Retirados</span>
            </h3>
            <div className="space-y-3">
              {materialesMasRetirados.map(([nombre, total], index) => (
                <div key={nombre} className="flex items-center justify-between p-3 rounded-xl border border-gray-50">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-sm text-gray-400 w-5">#{index + 1}</span>
                    <span className="font-medium text-sm text-gray-800 line-clamp-1">{nombre}</span>
                  </div>
                  <span className="font-bold text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                    {total} uds
                  </span>
                </div>
              ))}
              {materialesMasRetirados.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">No hay registros de salidas.</p>
              )}
            </div>
          </div>

          {/* Técnicos más activos */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-amber-500" />
              <span>Técnicos con Más Retiradas</span>
            </h3>
            <div className="space-y-3">
              {tecnicosMasActivos.map(([nombre, total], index) => (
                <div key={nombre} className="flex items-center justify-between p-3 rounded-xl border border-gray-50">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-sm text-gray-400 w-5">#{index + 1}</span>
                    <span className="font-medium text-sm text-gray-800 line-clamp-1">{nombre}</span>
                  </div>
                  <span className="font-bold text-sm text-gray-900 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
                    {total} uds
                  </span>
                </div>
              ))}
              {tecnicosMasActivos.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">No hay registros de salidas por técnico.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
