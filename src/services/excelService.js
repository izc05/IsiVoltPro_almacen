import * as XLSX from 'xlsx';

export const excelService = {
  /**
   * Exporta toda la base de datos a un archivo Excel estructurado por pestañas
   */
  exportBackup({ articulos, tecnicos, proveedores, movimientos, pedidos }) {
    try {
      const wb = XLSX.utils.book_new();

      // Hojas
      const wsArticulos = XLSX.utils.json_to_sheet(articulos.map(a => ({
        ID: a.id,
        'Código Interno': a.codigo,
        'Código QR': a.qr || a.codigo,
        Nombre: a.nombre,
        Categoría: a.categoria,
        Marca: a.marca || '',
        Modelo: a.modelo || '',
        Descripción: a.descripcion || '',
        Unidad: a.unidad,
        'Stock Actual': a.stockActual,
        'Stock Mínimo': a.stockMinimo,
        Ubicación: a.ubicacion || '',
        'Proveedor Principal': a.proveedorPrincipal || '',
        Activo: a.activo ? 'Sí' : 'No'
      })));
      XLSX.utils.book_append_sheet(wb, wsArticulos, 'Artículos');

      const wsTecnicos = XLSX.utils.json_to_sheet(tecnicos.map(t => ({
        ID: t.id,
        Nombre: t.nombre,
        Sección: t.seccion || '',
        Teléfono: t.telefono || '',
        Email: t.email || '',
        Activo: t.activo ? 'Sí' : 'No'
      })));
      XLSX.utils.book_append_sheet(wb, wsTecnicos, 'Técnicos');

      const wsProveedores = XLSX.utils.json_to_sheet(proveedores.map(p => ({
        ID: p.id,
        Nombre: p.nombre,
        'CIF/NIF': p.cif || '',
        Teléfono: p.telefono || '',
        Email: p.email || '',
        Dirección: p.direccion || '',
        'Persona de Contacto': p.personaContacto || '',
        Observaciones: p.observaciones || ''
      })));
      XLSX.utils.book_append_sheet(wb, wsProveedores, 'Proveedores');

      const wsMovimientos = XLSX.utils.json_to_sheet(movimientos.map(m => ({
        ID: m.id,
        Fecha: m.fecha,
        Tipo: m.tipo.toUpperCase(),
        'Artículo ID': m.articuloId,
        'Artículo Nombre': m.articuloNombre,
        'Código Artículo': m.codigo,
        Cantidad: m.cantidad,
        'Origen/Destino': m.origenDestino || '',
        'Documento/OT': m.documento || '',
        Observaciones: m.observaciones || '',
        Usuario: m.usuario
      })));
      XLSX.utils.book_append_sheet(wb, wsMovimientos, 'Movimientos');

      const wsPedidos = XLSX.utils.json_to_sheet(pedidos.flatMap(p => 
        p.articulos.map(art => ({
          'ID Pedido': p.id,
          Fecha: p.fecha,
          Proveedor: p.proveedor,
          'ID Artículo': art.articuloId,
          Código: art.codigo,
          Nombre: art.nombre,
          Cantidad: art.cantidad,
          'Estado Pedido': p.estado,
          Observaciones: p.observaciones || ''
        }))
      ));
      XLSX.utils.book_append_sheet(wb, wsPedidos, 'Pedidos');

      // Generar descarga
      XLSX.writeFile(wb, `isivoltpro-almacen-backup-${new Date().toISOString().split('T')[0]}.xlsx`);
      return true;
    } catch (e) {
      console.error('Error al exportar Excel', e);
      throw e;
    }
  },

  /**
   * Descarga la plantilla vacía para importar artículos, técnicos o proveedores
   */
  downloadTemplate(tipo) {
    try {
      const wb = XLSX.utils.book_new();
      let data = [];
      let filename = '';

      if (tipo === 'articulos') {
        data = [[
          'Código Interno', 'Nombre', 'Categoría', 'Marca', 'Modelo',
          'Descripción', 'Unidad', 'Stock Actual', 'Stock Mínimo',
          'Ubicación', 'Proveedor Principal'
        ]];
        filename = 'plantilla-articulos.xlsx';
      } else if (tipo === 'tecnicos') {
        data = [['Nombre', 'Sección', 'Teléfono', 'Email']];
        filename = 'plantilla-tecnicos.xlsx';
      } else if (tipo === 'proveedores') {
        data = [['Nombre', 'CIF/NIF', 'Teléfono', 'Email', 'Dirección', 'Persona de Contacto', 'Observaciones']];
        filename = 'plantilla-proveedores.xlsx';
      }

      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
      XLSX.writeFile(wb, filename);
      return true;
    } catch (e) {
      console.error('Error al descargar plantilla', e);
      throw e;
    }
  },

  /**
   * Procesa la lectura de un archivo Excel de importación
   */
  importFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }
};
