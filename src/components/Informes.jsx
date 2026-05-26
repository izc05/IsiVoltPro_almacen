import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { reportService } from '../services/reportService';
import { 
  Printer,
  FileBarChart2
} from 'lucide-react';

export default function Informes() {
  const { articulos, movimientos, pedidos, tecnicos, proveedores } = useApp();

  const [tipoReporte, setTipoReporte] = useState('stock-actual');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [seleccionPersona, setSeleccionPersona] = useState('');

  const [reporteGenerado, setReporteGenerado] = useState(null);

  const generarReporte = () => {
    let rep = null;
    switch (tipoReporte) {
      case 'stock-actual':
        rep = reportService.generarReporteStockActual(articulos);
        break;
      case 'stock-bajo':
        rep = reportService.generarReporteStockBajo(articulos);
        break;
      case 'entradas':
        rep = reportService.generarReporteMovimientos(movimientos, 'entrada', fechaInicio, fechaFin);
        break;
      case 'salidas':
        rep = reportService.generarReporteMovimientos(movimientos, 'salida', fechaInicio, fechaFin);
        break;
      case 'tecnico':
        rep = reportService.generarReporteTecnico(movimientos, seleccionPersona);
        break;
      case 'proveedor':
        rep = reportService.generarReporteProveedor(movimientos, seleccionPersona);
        break;
      case 'pedidos':
        rep = reportService.generarReportePedidos(pedidos);
        break;
      case 'inventario':
        rep = reportService.generarReporteInventario(movimientos);
        break;
      default:
        break;
    }
    setReporteGenerado(rep);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN DE CONFIGURACIÓN DE INFORME (Oculto al Imprimir) */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-6 no-print">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center space-x-2">
            <FileBarChart2 className="h-7 w-7 text-amber-500" />
            <span>Informes y Reportes</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">Genera reportes oficiales del estado del stock, entradas, salidas y auditoría de materiales.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tipo de Informe */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tipo de Reporte</label>
            <select
              value={tipoReporte}
              onChange={(e) => {
                setTipoReporte(e.target.value);
                setSeleccionPersona('');
                setReporteGenerado(null);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 text-gray-800 font-semibold"
            >
              <option value="stock-actual">Stock Actual</option>
              <option value="stock-bajo">Stock Bajo Mínimo (Rotura)</option>
              <option value="entradas">Entradas por Fechas</option>
              <option value="salidas">Salidas por Fechas</option>
              <option value="tecnico">Consumos por Técnico</option>
              <option value="proveedor">Suministros por Proveedor</option>
              <option value="pedidos">Historial de Pedidos</option>
              <option value="inventario">Ajustes e Inventario</option>
            </select>
          </div>

          {/* Filtros de Fecha (solo para movimientos) */}
          {(tipoReporte === 'entradas' || tipoReporte === 'salidas') && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden"
                />
              </div>
            </>
          )}

          {/* Seleccionar Técnico */}
          {tipoReporte === 'tecnico' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Seleccionar Técnico</label>
              <select
                value={seleccionPersona}
                onChange={(e) => setSeleccionPersona(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden text-gray-800 font-semibold"
              >
                <option value="">Selecciona técnico...</option>
                {tecnicos.map(t => (
                  <option key={t.id} value={t.nombre}>{t.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Seleccionar Proveedor */}
          {tipoReporte === 'proveedor' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Seleccionar Proveedor</label>
              <select
                value={seleccionPersona}
                onChange={(e) => setSeleccionPersona(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden text-gray-800 font-semibold"
              >
                <option value="">Selecciona proveedor...</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Botón de Generar */}
          <div className="flex items-end">
            <button
              onClick={generarReporte}
              disabled={(tipoReporte === 'tecnico' || tipoReporte === 'proveedor') && !seleccionPersona}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              Generar Reporte
            </button>
          </div>
        </div>
      </div>

      {/* REPORTE VISTA PREVIA IMPRIMIBLE (Formato A4) */}
      {reporteGeneratedWrapper(reporteGenerado, handleImprimir)}

    </div>
  );
}

function reporteGeneratedWrapper(reporte, printFn) {
  if (!reporte) return null;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 animate-scale-up space-y-6 print-card">
      
      {/* Cabecera del Reporte */}
      <div className="flex items-start justify-between border-b-2 border-gray-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight m-0">
            IsiVolt<span className="text-amber-500">Pro</span> S.L.
          </h1>
          <p className="text-xs text-gray-500 mt-1">Polígono Industrial Las Palmeras, Nave 4 • Madrid</p>
          <p className="text-xs text-gray-400">Tel: 900 100 200 • info@isivoltpro.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-bold text-gray-950 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded">Reporte Oficial</h2>
          <p className="text-xs text-gray-500 mt-2"><strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-ES')}</p>
          <p className="text-xs text-gray-400"><strong>Documento de Almacén</strong></p>
        </div>
      </div>

      {/* Título del reporte */}
      <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-100">
        <h3 className="font-extrabold text-lg text-gray-900 uppercase tracking-wide">{reporte.titulo}</h3>
      </div>

      {/* Tabla del reporte */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100">
              {reporte.columnas.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-3 py-2.5 font-extrabold text-gray-700 uppercase ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
            {reporte.filas.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50/50">
                {reporte.columnas.map((col, colIdx) => {
                  const val = row[col.key];
                  return (
                    <td 
                      key={colIdx} 
                      className={`px-3 py-2 ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      } ${col.highlight ? 'text-red-600 font-bold' : ''}`}
                    >
                      {col.format === 'image'
                        ? val
                          ? <img src={val} alt={col.header} className="h-12 max-w-28 object-contain border border-gray-200 rounded bg-white" />
                          : '-'
                        : col.format === 'currency' 
                        ? `${Number(val).toFixed(2)}€`
                        : col.format === 'diff'
                        ? `${val > 0 ? '+' : ''}${val}`
                        : val
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
            {reporte.filas.length === 0 && (
              <tr>
                <td colSpan={reporte.columnas.length} className="px-3 py-8 text-center text-gray-400">
                  No se encontraron registros para este informe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen Final */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-gray-200 pt-6">
        {/* Espacio para Firma */}
        <div className="border border-gray-200 rounded-xl p-4 w-64 bg-slate-50/50 flex flex-col justify-between h-28 print:border-black">
          <span className="text-[10px] text-gray-400 uppercase font-black">Firma Autorizada / Responsable</span>
          <div className="h-10 border-b border-dashed border-gray-300" />
          <span className="text-[10px] text-gray-500 font-semibold text-center mt-1">D./Dña. Administrador Almacén</span>
        </div>

        {/* Resumen de totales */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-w-[250px] space-y-2">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Resumen del Informe</h4>
          {reporte.resumen.map((res, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-semibold">{res.label}:</span>
              <span className="font-extrabold text-gray-900 text-sm">
                {res.format === 'currency' ? `${Number(res.value).toFixed(2)}€` : res.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Botón de Impresión (Oculto al Imprimir) */}
      <div className="flex justify-end pt-4 border-t border-gray-100 no-print">
        <button
          onClick={printFn}
          className="flex items-center justify-center space-x-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-xs transition-colors"
        >
          <Printer className="h-5 w-5 text-amber-500" />
          <span>Imprimir / Exportar a PDF</span>
        </button>
      </div>

    </div>
  );
}
