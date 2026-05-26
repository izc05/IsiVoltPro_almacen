import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { excelService } from '../services/excelService';
import { 
  Settings, 
  Download, 
  Upload, 
  Database, 
  Save, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  FileJson
} from 'lucide-react';

export default function Ajustes() {
  const { 
    articulos, 
    tecnicos, 
    proveedores, 
    movimientos, 
    pedidos, 
    ajustes, 
    guardarAjustes, 
    restablecerBD,
    reemplazarBaseDatos,
    exportarJson,
    importarJson
  } = useApp();

  const [formAjustes, setFormAjustes] = useState({ ...ajustes });

  // Estado de plantilla Excel
  const [tipoPlantilla, setTipoPlantilla] = useState('articulos');

  // Estado de Importación
  const [archivoExcel, setArchivoExcel] = useState(null);
  const [tipoImportacion, setTipoImportacion] = useState('articulos');
  const [resultadoImportacion, setResultadoImportacion] = useState(null);
  const [errorImportacion, setErrorImportacion] = useState('');
  const [resetTexto, setResetTexto] = useState('');

  const handleGuardarEmpresa = (e) => {
    e.preventDefault();
    guardarAjustes(formAjustes);
  };

  const handleDescargarPlantilla = () => {
    try {
      excelService.downloadTemplate(tipoPlantilla);
    } catch {
      alert('Error al descargar plantilla');
    }
  };

  const handleExportarTodo = () => {
    try {
      excelService.exportBackup({
        articulos,
        tecnicos,
        proveedores,
        movimientos,
        pedidos
      });
    } catch {
      alert('Error al exportar base de datos');
    }
  };

  const handleJsonImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (confirm('Vas a reemplazar todos los datos locales con esta copia JSON. ¿Continuar?')) {
          await importarJson(parsed);
        }
      } catch {
        alert('No se pudo leer el JSON seleccionado.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    setArchivoExcel(e.target.files[0]);
    setResultadoImportacion(null);
    setErrorImportacion('');
  };

  const ejecutarImportacion = async () => {
    if (!archivoExcel) {
      setErrorImportacion('Selecciona un archivo Excel primero.');
      return;
    }

    try {
      const datosJson = await excelService.importFile(archivoExcel);
      
      let agregados = 0;
      let ignorados = 0;
      let errores = 0;
      const codigosExistentes = new Set(articulos.map(a => a.codigo.trim().toUpperCase()));

      if (tipoImportacion === 'articulos') {
        const nuevosArticulos = [];

        datosJson.forEach((row, index) => {
          try {
            const codigo = String(row['Código Interno'] || '').trim().toUpperCase();
            const nombre = String(row['Nombre'] || '').trim();
            const categoria = String(row['Categoría'] || '').trim();

            if (!codigo || !nombre || !categoria) {
              errores++;
              return;
            }

            // Validar no duplicar
            if (codigosExistentes.has(codigo)) {
              ignorados++;
              return;
            }

            nuevosArticulos.push({
              id: `art-import-${Date.now()}-${index}`,
              codigo,
              qr: codigo,
              nombre,
              categoria,
              marca: row['Marca'] || '',
              modelo: row['Modelo'] || '',
              descripcion: row['Descripción'] || '',
              unidad: row['Unidad'] || 'ud',
              stockActual: Number(row['Stock Actual']) || 0,
              stockMinimo: Number(row['Stock Mínimo']) || 5,
              ubicacion: String(row['Ubicación'] || '').trim().toUpperCase(),
              proveedorPrincipal: row['Proveedor Principal'] || '',
              activo: true
            });
            agregados++;
            codigosExistentes.add(codigo);
          } catch {
            errores++;
          }
        });

        if (agregados > 0) {
          reemplazarBaseDatos([...articulos, ...nuevosArticulos], null, null);
        }

      } else if (tipoImportacion === 'tecnicos') {
        const nuevosTecnicos = [];
        const nombresExistentes = new Set(tecnicos.map(t => t.nombre.trim().toUpperCase()));

        datosJson.forEach((row, index) => {
          try {
            const nombre = String(row['Nombre'] || '').trim();
            if (!nombre) {
              errores++;
              return;
            }

            if (nombresExistentes.has(nombre.toUpperCase())) {
              ignorados++;
              return;
            }

            nuevosTecnicos.push({
              id: `tec-import-${Date.now()}-${index}`,
              nombre,
              seccion: row['Sección'] || 'General',
              telefono: String(row['Teléfono'] || ''),
              email: row['Email'] || '',
              activo: true
            });
            agregados++;
          } catch {
            errores++;
          }
        });

        if (agregados > 0) {
          reemplazarBaseDatos(null, [...tecnicos, ...nuevosTecnicos], null);
        }

      } else if (tipoImportacion === 'proveedores') {
        const nuevosProveedores = [];
        const nombresExistentes = new Set(proveedores.map(p => p.nombre.trim().toUpperCase()));

        datosJson.forEach((row, index) => {
          try {
            const nombre = String(row['Nombre'] || '').trim();
            if (!nombre) {
              errores++;
              return;
            }

            if (nombresExistentes.has(nombre.toUpperCase())) {
              ignorados++;
              return;
            }

            nuevosProveedores.push({
              id: `prov-import-${Date.now()}-${index}`,
              nombre,
              cif: String(row['CIF/NIF'] || '').trim().toUpperCase(),
              telefono: String(row['Teléfono'] || ''),
              email: row['Email'] || '',
              direccion: row['Dirección'] || '',
              personaContacto: row['Persona de Contacto'] || '',
              observaciones: row['Observaciones'] || ''
            });
            agregados++;
          } catch {
            errores++;
          }
        });

        if (agregados > 0) {
          reemplazarBaseDatos(null, null, [...proveedores, ...nuevosProveedores]);
        }
      }

      setResultadoImportacion({
        agregados,
        ignorados,
        errores
      });
      setArchivoExcel(null);
    } catch {
      setErrorImportacion('Error al procesar el archivo Excel. Asegúrate de usar el formato correcto.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Ajustes del Sistema</h2>
        <p className="text-gray-500 text-sm mt-1">Configura los datos de tu empresa, descarga plantillas e importa/exporta datos en Excel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CONFIGURACIÓN EMPRESA */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Settings className="h-5 w-5 text-amber-500" />
            <span>Datos de la Empresa</span>
          </h3>

          <form onSubmit={handleGuardarEmpresa} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={formAjustes.nombreEmpresa || ''}
                  onChange={(e) => setFormAjustes({ ...formAjustes, nombreEmpresa: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CIF / NIF</label>
                <input
                  type="text"
                  value={formAjustes.cifEmpresa || ''}
                  onChange={(e) => setFormAjustes({ ...formAjustes, cifEmpresa: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formAjustes.telefono || ''}
                  onChange={(e) => setFormAjustes({ ...formAjustes, telefono: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formAjustes.email || ''}
                  onChange={(e) => setFormAjustes({ ...formAjustes, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dirección Comercial</label>
                <input
                  type="text"
                  value={formAjustes.direccion || ''}
                  onChange={(e) => setFormAjustes({ ...formAjustes, direccion: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Ajustes</span>
            </button>
          </form>
        </div>

        {/* COPIAS DE SEGURIDAD & RESTAURACIÓN */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-6">
          
          {/* Mantenimiento de BD */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <Database className="h-5 w-5 text-gray-500" />
              <span>Copias de Seguridad (Backup)</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleExportarTodo}
                className="flex items-center justify-center space-x-2 p-4 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold shadow-xs transition-all text-gray-700"
              >
                <Download className="h-5 w-5 text-amber-500" />
                <div className="text-left">
                  <p className="font-extrabold">Exportar a Excel</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-0.5">Respaldar artículos, personas y pedidos.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  if (resetTexto === 'RESET DEMO' && confirm('Última confirmación: se borrarán tus datos locales y se cargarán datos demo.')) {
                    restablecerBD();
                    setResetTexto('');
                  }
                }}
                disabled={resetTexto !== 'RESET DEMO'}
                className="flex items-center justify-center space-x-2 p-4 border border-rose-100 hover:bg-rose-50/30 rounded-xl text-xs font-bold shadow-xs transition-all text-rose-700"
              >
                <Trash2 className="h-5 w-5 text-rose-500" />
                <div className="text-left">
                  <p className="font-extrabold">Restaurar Base de Datos</p>
                  <p className="text-[10px] text-rose-400 font-normal mt-0.5">Cargar los 10 artículos y movimientos demo.</p>
                </div>
              </button>
            </div>
            <input
              value={resetTexto}
              onChange={(e) => setResetTexto(e.target.value)}
              placeholder="Escribe RESET DEMO para activar el reinicio"
              className="mt-3 w-full rounded-xl border border-rose-100 bg-rose-50/40 px-3 py-2 text-xs font-semibold text-rose-700 outline-hidden focus:border-rose-300"
            />
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
              <FileJson className="h-4 w-4 text-amber-500" />
              <span>Copia completa JSON</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={exportarJson}
                className="flex items-center justify-center space-x-2 rounded-xl border border-gray-200 bg-white p-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 text-amber-500" />
                <span>Exportar JSON</span>
              </button>
              <label className="flex cursor-pointer items-center justify-center space-x-2 rounded-xl border border-gray-200 bg-white p-3 text-xs font-bold text-gray-700 hover:bg-gray-50">
                <Upload className="h-4 w-4 text-amber-500" />
                <span>Importar JSON</span>
                <input type="file" accept=".json,application/json" onChange={handleJsonImport} className="hidden" />
              </label>
            </div>
          </div>

          {/* DESCARGA DE PLANTILLA EXCEL */}
          <div className="space-y-3 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-gray-800">Descargar Plantilla de Importación</h4>
            <div className="flex space-x-2">
              <select
                value={tipoPlantilla}
                onChange={(e) => setTipoPlantilla(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
              >
                <option value="articulos">Artículos</option>
                <option value="tecnicos">Técnicos</option>
                <option value="proveedores">Proveedores</option>
              </select>
              <button
                onClick={handleDescargarPlantilla}
                className="flex items-center space-x-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <Download className="h-4 w-4 text-amber-500" />
                <span>Descargar Excel</span>
              </button>
            </div>
          </div>

          {/* IMPORTACIÓN EXCEL */}
          <div className="space-y-4 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
              <Upload className="h-4 w-4 text-amber-500" />
              <span>Importar Datos desde Excel</span>
            </h4>
            
            {errorImportacion && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{errorImportacion}</span>
              </div>
            )}

            {resultadoImportacion && (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs space-y-1">
                <div className="flex items-center space-x-1.5 font-bold mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Resumen de Importación</span>
                </div>
                <p>• Registros añadidos: <strong>{resultadoImportacion.agregados}</strong></p>
                <p>• Registros ignorados (duplicados): <strong>{resultadoImportacion.ignorados}</strong></p>
                <p>• Registros con errores de formato: <strong>{resultadoImportacion.errores}</strong></p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={tipoImportacion}
                onChange={(e) => {
                  setTipoImportacion(e.target.value);
                  setResultadoImportacion(null);
                }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
              >
                <option value="articulos">Artículos</option>
                <option value="tecnicos">Técnicos</option>
                <option value="proveedores">Proveedores</option>
              </select>

              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="flex-1 text-xs text-gray-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />

              <button
                onClick={ejecutarImportacion}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Procesar
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
