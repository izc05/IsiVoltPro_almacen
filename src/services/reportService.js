export const reportService = {
  generarReporteStockActual(articulos) {
    const data = articulos.filter(a => a.activo).map(a => ({
      codigo: a.codigo,
      nombre: a.nombre,
      categoria: a.categoria,
      ubicacion: a.ubicacion || 'N/A',
      stockActual: a.stockActual,
      unidad: a.unidad
    }));

    const totalArticulos = data.length;
    const stockTotal = data.reduce((sum, a) => sum + a.stockActual, 0);

    return {
      titulo: 'Informe de Stock Actual del Almacén',
      columnas: [
        { header: 'Código', key: 'codigo' },
        { header: 'Nombre', key: 'nombre' },
        { header: 'Sector', key: 'categoria' },
        { header: 'Ubicación', key: 'ubicacion' },
        { header: 'Stock', key: 'stockActual', align: 'right' },
        { header: 'Unidad', key: 'unidad' }
      ],
      filas: data,
      resumen: [
        { label: 'Total Artículos Diferentes', value: totalArticulos },
        { label: 'Unidades Totales en Stock', value: stockTotal }
      ]
    };
  },

  generarReporteStockBajo(articulos) {
    const data = articulos
      .filter(a => a.activo && a.stockActual <= a.stockMinimo)
      .map(a => ({
        codigo: a.codigo,
        nombre: a.nombre,
        categoria: a.categoria,
        stockActual: a.stockActual,
        stockMinimo: a.stockMinimo,
        unidad: a.unidad,
        deficiencia: a.stockMinimo - a.stockActual
      }));

    return {
      titulo: 'Informe de Stock por debajo de Mínimos (Rotura)',
      columnas: [
        { header: 'Código', key: 'codigo' },
        { header: 'Artículo', key: 'nombre' },
        { header: 'Sector', key: 'categoria' },
        { header: 'Stock Actual', key: 'stockActual', align: 'right' },
        { header: 'Stock Mínimo', key: 'stockMinimo', align: 'right' },
        { header: 'Faltante', key: 'deficiencia', align: 'right', highlight: true }
      ],
      filas: data,
      resumen: [
        { label: 'Artículos en Alerta de Stock', value: data.length }
      ]
    };
  },

  generarReporteMovimientos(movimientos, tipo = 'todos', fechaInicio = null, fechaFin = null) {
    let filtrados = [...movimientos];

    if (tipo !== 'todos') {
      filtrados = filtrados.filter(m => m.tipo === tipo);
    }

    if (fechaInicio) {
      const start = new Date(fechaInicio);
      filtrados = filtrados.filter(m => new Date(m.fecha) >= start);
    }

    if (fechaFin) {
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59, 999);
      filtrados = filtrados.filter(m => new Date(m.fecha) <= end);
    }

    const data = filtrados.map(m => ({
      fecha: new Date(m.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
      tipo: m.tipo.toUpperCase(),
      codigo: m.codigo,
      nombre: m.articuloNombre,
      cantidad: m.cantidad,
      origenDestino: m.origenDestino || '-',
      almacenNombre: m.almacenNombre || '-',
      documento: m.documento || '-',
      observaciones: m.observaciones || '-',
      prueba: m.firma || m.foto || ''
    }));

    const totalEntradas = filtrados.filter(m => m.tipo === 'entrada').length;
    const totalSalidas = filtrados.filter(m => m.tipo === 'salida').length;
    const totalAjustes = filtrados.filter(m => m.tipo === 'ajuste').length;

    return {
      titulo: `Informe de Movimientos de Almacén (${tipo.toUpperCase()})`,
      columnas: [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Tipo', key: 'tipo' },
        { header: 'Código', key: 'codigo' },
        { header: 'Artículo', key: 'nombre' },
        { header: 'Cantidad', key: 'cantidad', align: 'right' },
        { header: 'Almacén', key: 'almacenNombre' },
        { header: 'Origen/Destino', key: 'origenDestino' },
        { header: 'Documento/OT', key: 'documento' },
        { header: 'Observaciones', key: 'observaciones' },
        { header: 'Firma/Foto', key: 'prueba', format: 'image' }
      ],
      filas: data,
      resumen: [
        { label: 'Total Movimientos Registrados', value: filtrados.length },
        { label: 'Entradas', value: totalEntradas },
        { label: 'Salidas (Retiradas)', value: totalSalidas },
        { label: 'Ajustes de Inventario', value: totalAjustes }
      ]
    };
  },

  generarReporteTecnico(movimientos, tecnicoNombre) {
    const salidas = movimientos.filter(m => m.tipo === 'salida' && m.origenDestino === tecnicoNombre);

    const data = salidas.map(m => ({
      fecha: new Date(m.fecha).toLocaleDateString('es-ES'),
      codigo: m.codigo,
      nombre: m.articuloNombre,
      cantidad: m.cantidad,
      documento: m.documento || 'Sin OT',
      observaciones: m.observaciones || '-',
      firma: m.firma || ''
    }));

    const totalMaterialRetirado = salidas.reduce((sum, m) => sum + m.cantidad, 0);

    return {
      titulo: `Informe de Consumos por Técnico: ${tecnicoNombre}`,
      columnas: [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Código Artículo', key: 'codigo' },
        { header: 'Artículo', key: 'nombre' },
        { header: 'Cantidad Retirada', key: 'cantidad', align: 'right' },
        { header: 'OT / Obra', key: 'documento' },
        { header: 'Observaciones', key: 'observaciones' },
        { header: 'Firma', key: 'firma', format: 'image' }
      ],
      filas: data,
      resumen: [
        { label: 'Número de Retiradas', value: salidas.length },
        { label: 'Unidades Totales Retiradas', value: totalMaterialRetirado }
      ]
    };
  },

  generarReporteProveedor(movimientos, proveedorNombre) {
    const entradas = movimientos.filter(m => m.tipo === 'entrada' && m.origenDestino === proveedorNombre);

    const data = entradas.map(m => ({
      fecha: new Date(m.fecha).toLocaleDateString('es-ES'),
      codigo: m.codigo,
      nombre: m.articuloNombre,
      cantidad: m.cantidad,
      documento: m.documento || 'Sin Albarán',
      observaciones: m.observaciones || '-'
    }));

    const totalEntradasSuministradas = entradas.reduce((sum, m) => sum + m.cantidad, 0);

    return {
      titulo: `Informe de Suministros por Proveedor: ${proveedorNombre}`,
      columnas: [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Código Artículo', key: 'codigo' },
        { header: 'Artículo', key: 'nombre' },
        { header: 'Cantidad Recibida', key: 'cantidad', align: 'right' },
        { header: 'Albarán/Factura', key: 'documento' },
        { header: 'Observaciones', key: 'observaciones' }
      ],
      filas: data,
      resumen: [
        { label: 'Número de Entradas de Material', value: entradas.length },
        { label: 'Unidades Totales Recibidas', value: totalEntradasSuministradas }
      ]
    };
  },

  generarReportePedidos(pedidos) {
    const data = pedidos.map(p => ({
      id: p.id,
      fecha: p.fecha,
      proveedor: p.proveedor,
      items: p.articulos.length,
      estado: p.estado
    }));

    const totalPedidos = pedidos.length;

    return {
      titulo: 'Informe General de Pedidos a Proveedor',
      columnas: [
        { header: 'ID Pedido', key: 'id' },
        { header: 'Fecha', key: 'fecha' },
        { header: 'Proveedor', key: 'proveedor' },
        { header: 'Líneas de Artículos', key: 'items', align: 'right' },
        { header: 'Estado', key: 'estado' }
      ],
      filas: data,
      resumen: [
        { label: 'Total Pedidos Registrados', value: totalPedidos }
      ]
    };
  },

  generarReporteInventario(movimientos) {
    const ajustes = movimientos.filter(m => m.tipo === 'ajuste');

    const data = ajustes.map(m => ({
      fecha: new Date(m.fecha).toLocaleString('es-ES', { dateStyle: 'short' }),
      codigo: m.codigo,
      nombre: m.articuloNombre,
      diferencia: m.cantidad, // cantidad es positiva o negativa en ajustes
      usuario: m.usuario,
      observaciones: m.observaciones
    }));

    const descuadreNegativo = data.filter(d => d.diferencia < 0).reduce((sum, d) => sum + d.diferencia, 0);
    const descuadrePositivo = data.filter(d => d.diferencia > 0).reduce((sum, d) => sum + d.diferencia, 0);

    return {
      titulo: 'Informe de Descuadres y Ajustes de Inventario',
      columnas: [
        { header: 'Fecha Ajuste', key: 'fecha' },
        { header: 'Código', key: 'codigo' },
        { header: 'Artículo', key: 'nombre' },
        { header: 'Diferencia Stock', key: 'diferencia', align: 'right', format: 'diff' },
        { header: 'Operador', key: 'usuario' },
        { header: 'Detalles del Ajuste', key: 'observaciones' }
      ],
      filas: data,
      resumen: [
        { label: 'Total de Ajustes Realizados', value: data.length },
        { label: 'Unidades Perdidas (Faltantes)', value: descuadreNegativo },
        { label: 'Unidades Añadidas (Excedentes)', value: descuadrePositivo }
      ]
    };
  }
};
