import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  FileText, 
  RefreshCw,
} from 'lucide-react';

export default function Inventario() {
  const { articulos, almacenes, registrarInventarioAlmacen, movimientos } = useApp();

  const [articuloId, setArticuloId] = useState('');
  const [almacenId, setAlmacenId] = useState('alm-principal');
  const [stockFisico, setStockFisico] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [resultadoAjuste, setResultadoAjuste] = useState(null);
  const [errorForm, setErrorForm] = useState('');

  const ejecutarAjuste = (e) => {
    e.preventDefault();
    setErrorForm('');
    setResultadoAjuste(null);

    if (!articuloId || stockFisico === '') {
      setErrorForm('Debe seleccionar un artículo e ingresar el stock físico real.');
      return;
    }

    const art = articulos.find(a => a.id === articuloId);
    if (!art) return;

    try {
      const stockFisNum = Number(stockFisico);
      const anteriorAlmacen = Number(art.stockPorAlmacen?.[almacenId]) || 0;
      const diferencia = stockFisNum - anteriorAlmacen;
      
      registrarInventarioAlmacen(articuloId, stockFisNum, observaciones, almacenId);

      setResultadoAjuste({
        articuloNombre: art.nombre,
        codigo: art.codigo,
        almacen: almacenes.find((almacen) => almacen.id === almacenId)?.nombre || 'Almacén',
        anterior: anteriorAlmacen,
        nuevo: stockFisNum,
        diferencia,
        unidad: art.unidad
      });

      // Resetear formulario
      setArticuloId('');
      setStockFisico('');
      setObservaciones('');
    } catch (err) {
      setErrorForm(err.message);
    }
  };

  const getAjustesRecientes = () => {
    return movimientos.filter(m => m.tipo === 'ajuste').slice(0, 5);
  };

  const articulosActivos = articulos.filter(a => a.activo);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* FORMULARIO DE AUDITORÍA */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 animate-scale-up space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center space-x-2">
            <Settings className="h-6 w-6 text-amber-500 animate-spin-slow" />
            <span>Auditoría de Almacén</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">Realiza ajustes físicos de inventario para corregir descuadres de stock.</p>
        </div>

        <form onSubmit={ejecutarAjuste} className="space-y-4">
          {errorForm && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-semibold flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{errorForm}</span>
            </div>
          )}

          {/* Artículo */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Artículo a Auditar *</label>
            <select
              required
              value={articuloId}
              onChange={(e) => setArticuloId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 text-gray-800 font-semibold"
            >
              <option value="">Selecciona artículo...</option>
              {articulosActivos.map(art => (
                <option key={art.id} value={art.id}>
                  {art.codigo} - {art.nombre} (Stock Registrado: {art.stockActual} {art.unidad})
                </option>
              ))}
            </select>
          </div>

          {articuloId && (
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-xs space-y-1">
              <span className="font-bold text-amber-800">Ubicación física registrada:</span>
              <p className="font-mono text-gray-700">{articulos.find(a => a.id === articuloId)?.ubicacion || 'Sin ubicación registrada'}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Almacén auditado *</label>
            <select
              required
              value={almacenId}
              onChange={(e) => setAlmacenId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 text-gray-800 font-semibold"
            >
              {almacenes.map((almacen) => (
                <option key={almacen.id} value={almacen.id}>{almacen.nombre}</option>
              ))}
            </select>
          </div>

          {/* Cantidad Física */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Stock Físico Real Contado *</label>
            <input
              type="number"
              required
              min="0"
              placeholder="Ej. Cantidad real en estantería"
              value={stockFisico}
              onChange={(e) => setStockFisico(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Motivo / Observaciones del ajuste</label>
            <textarea
              rows="3"
              placeholder="Ej. Descuadre en recuento trimestral, rotura de material..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Aplicar Ajuste de Stock</span>
          </button>
        </form>

        {/* FEEDBACK DEL RESULTADO */}
        {resultadoAjuste && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2 animate-scale-up">
            <div className="flex items-center space-x-2 text-emerald-800">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <h4 className="font-bold text-sm">Ajuste de Stock Realizado</h4>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Artículo:</strong> {resultadoAjuste.articuloNombre} ({resultadoAjuste.codigo})</p>
              <p><strong>Almacén:</strong> {resultadoAjuste.almacen}</p>
              <p><strong>Stock Anterior:</strong> {resultadoAjuste.anterior} {resultadoAjuste.unidad}</p>
              <p><strong>Stock Nuevo:</strong> {resultadoAjuste.nuevo} {resultadoAjuste.unidad}</p>
              <p className="font-bold">
                <strong>Diferencia:</strong> {resultadoAjuste.diferencia > 0 ? `+${resultadoAjuste.diferencia}` : resultadoAjuste.diferencia} {resultadoAjuste.unidad}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* HISTORIAL RECIENTE DE AJUSTES */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <span>Ajustes Recientes</span>
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">Últimas correcciones de inventario realizadas en el almacén.</p>
        </div>

        <div className="space-y-3">
          {getAjustesRecientes().map((mov) => (
            <div key={mov.id} className="flex items-start justify-between p-3 rounded-xl bg-gray-50 text-xs">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{mov.articuloNombre}</h4>
                <p className="text-gray-400 font-mono mt-0.5">{mov.codigo} • {new Date(mov.fecha).toLocaleDateString('es-ES')}</p>
                {mov.observaciones && (
                  <p className="text-gray-500 italic mt-1 font-medium bg-white px-2 py-1 rounded border border-gray-100">
                    Obs: {mov.observaciones}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                  mov.cantidad > 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                </span>
              </div>
            </div>
          ))}
          {getAjustesRecientes().length === 0 && (
            <p className="text-center text-sm text-gray-400 py-12">No se han registrado descuadres o ajustes de inventario.</p>
          )}
        </div>
      </div>

    </div>
  );
}
