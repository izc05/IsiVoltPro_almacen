import { storageService } from './storageService';

const getCurrentOperator = () => storageService.getCurrentUser()?.nombre || 'Administrador';

const getAlmacen = (almacenId) => {
  const almacenes = storageService.getAlmacenes();
  return almacenes.find((almacen) => almacen.id === almacenId) || almacenes[0];
};

const sumStock = (stockPorAlmacen = {}) => (
  Object.values(stockPorAlmacen).reduce((sum, value) => sum + (Number(value) || 0), 0)
);

const addAudit = (accion, entidad, id, before, after) => {
  storageService.addAudit({
    accion,
    entidad,
    entidadId: id,
    usuario: getCurrentOperator(),
    antes: before || null,
    despues: after || null
  });
};

export const inventoryService = {
  getAlmacenes() {
    return storageService.getAlmacenes();
  },

  // --- ARTÍCULOS ---
  getArticulos() {
    return storageService.get('ARTICULOS');
  },

  crearArticulo(articulo) {
    const articulos = this.getArticulos();
    // Validar código único
    if (articulos.some(a => a.codigo.trim().toUpperCase() === articulo.codigo.trim().toUpperCase())) {
      throw new Error(`Ya existe un artículo con el código interno: ${articulo.codigo}`);
    }
    const nuevoArticulo = {
      ...articulo,
      id: `art-${Date.now()}`,
      stockPorAlmacen: articulo.stockPorAlmacen || {
        'alm-principal': Number(articulo.stockActual) || 0,
        'alm-electricidad': 0,
        'alm-fontaneria': 0,
        'alm-clima': 0
      },
      stockMinimo: Number(articulo.stockMinimo) || 0,
      precioEstimado: Number(articulo.precioEstimado) || 0,
      activo: articulo.activo !== undefined ? articulo.activo : true,
      qr: articulo.codigo
    };
    nuevoArticulo.stockActual = sumStock(nuevoArticulo.stockPorAlmacen);
    articulos.push(nuevoArticulo);
    storageService.set('ARTICULOS', articulos);
    addAudit('crear', 'articulo', nuevoArticulo.id, null, nuevoArticulo);

    // Si tiene stock inicial, registramos entrada
    if (nuevoArticulo.stockActual > 0) {
      this.registrarEntrada(nuevoArticulo.id, nuevoArticulo.stockActual, {
        documento: 'STOCK-INICIAL',
        observaciones: 'Registro inicial de stock al crear el artículo',
        proveedorPrincipal: nuevoArticulo.proveedorPrincipal || 'Inventario Inicial',
        almacenId: 'alm-principal'
      }, false); // false para evitar bucle de guardado de artículos
    }

    return nuevoArticulo;
  },

  editarArticulo(id, dataActualizada) {
    const articulos = this.getArticulos();
    const idx = articulos.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Artículo no encontrado');

    // Validar código único si cambia
    if (dataActualizada.codigo && dataActualizada.codigo !== articulos[idx].codigo) {
      if (articulos.some(a => a.codigo.trim().toUpperCase() === dataActualizada.codigo.trim().toUpperCase() && a.id !== id)) {
        throw new Error(`Ya existe otro artículo con el código interno: ${dataActualizada.codigo}`);
      }
    }

    const anterior = articulos[idx];
    const modificado = {
      ...anterior,
      ...dataActualizada,
      stockMinimo: dataActualizada.stockMinimo === undefined ? anterior.stockMinimo : Number(dataActualizada.stockMinimo) || 0,
      precioEstimado: dataActualizada.precioEstimado === undefined ? anterior.precioEstimado : Number(dataActualizada.precioEstimado) || 0,
      // No modificamos stockActual aquí, debe pasar por entrada/salida/ajuste
    };
    modificado.stockPorAlmacen = anterior.stockPorAlmacen || { 'alm-principal': Number(anterior.stockActual) || 0 };
    modificado.stockActual = sumStock(modificado.stockPorAlmacen);

    articulos[idx] = modificado;
    storageService.set('ARTICULOS', articulos);
    addAudit('editar', 'articulo', id, anterior, modificado);
    return modificado;
  },

  eliminarArticuloLogico(id) {
    // Desactivar artículo
    return this.editarArticulo(id, { activo: false });
  },

  // --- TÉCNICOS ---
  getTecnicos() {
    return storageService.get('TECNICOS');
  },

  crearTecnico(tecnico) {
    const tecnicos = this.getTecnicos();
    const nuevo = {
      ...tecnico,
      id: `tec-${Date.now()}`,
      activo: tecnico.activo !== undefined ? tecnico.activo : true
    };
    tecnicos.push(nuevo);
    storageService.set('TECNICOS', tecnicos);
    addAudit('crear', 'tecnico', nuevo.id, null, nuevo);
    return nuevo;
  },

  editarTecnico(id, data) {
    const tecnicos = this.getTecnicos();
    const idx = tecnicos.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Técnico no encontrado');
    const anterior = tecnicos[idx];
    tecnicos[idx] = { ...tecnicos[idx], ...data };
    storageService.set('TECNICOS', tecnicos);
    addAudit('editar', 'tecnico', id, anterior, tecnicos[idx]);
    return tecnicos[idx];
  },

  // --- PROVEEDORES ---
  getProveedores() {
    return storageService.get('PROVEEDORES');
  },

  crearProveedor(proveedor) {
    const proveedores = this.getProveedores();
    const nuevo = {
      ...proveedor,
      id: `prov-${Date.now()}`
    };
    proveedores.push(nuevo);
    storageService.set('PROVEEDORES', proveedores);
    addAudit('crear', 'proveedor', nuevo.id, null, nuevo);
    return nuevo;
  },

  editarProveedor(id, data) {
    const proveedores = this.getProveedores();
    const idx = proveedores.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Proveedor no encontrado');
    const anterior = proveedores[idx];
    proveedores[idx] = { ...proveedores[idx], ...data };
    storageService.set('PROVEEDORES', proveedores);
    addAudit('editar', 'proveedor', id, anterior, proveedores[idx]);
    return proveedores[idx];
  },

  // --- MOVIMIENTOS Y CONTROL DE STOCK ---
  getMovimientos() {
    return storageService.get('MOVIMIENTOS');
  },

  registrarMovimiento(movimiento) {
    const movimientos = this.getMovimientos();
    const nuevo = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fecha: new Date().toISOString(),
      usuario: getCurrentOperator(),
      ...movimiento
    };
    movimientos.unshift(nuevo); // Los más recientes primero
    storageService.set('MOVIMIENTOS', movimientos);
    addAudit('crear', 'movimiento', nuevo.id, null, nuevo);
    return nuevo;
  },

  registrarEntrada(articuloId, cantidad, { proveedor, documento, observaciones, foto, almacenId = 'alm-principal' }, actualizarArticulo = true) {
    const cant = Number(cantidad);
    if (cant <= 0) throw new Error('La cantidad debe ser mayor que 0');

    const almacen = getAlmacen(almacenId);
    let articulo;
    if (actualizarArticulo) {
      const articulos = this.getArticulos();
      const idx = articulos.findIndex(a => a.id === articuloId);
      if (idx === -1) throw new Error('Artículo no encontrado');
      
      articulos[idx].stockPorAlmacen = articulos[idx].stockPorAlmacen || { 'alm-principal': Number(articulos[idx].stockActual) || 0 };
      articulos[idx].stockPorAlmacen[almacen.id] = (Number(articulos[idx].stockPorAlmacen[almacen.id]) || 0) + cant;
      articulos[idx].stockActual = sumStock(articulos[idx].stockPorAlmacen);
      articulo = articulos[idx];
      storageService.set('ARTICULOS', articulos);
    } else {
      articulo = this.getArticulos().find(a => a.id === articuloId);
    }

    return this.registrarMovimiento({
      tipo: 'entrada',
      articuloId,
      articuloNombre: articulo.nombre,
      codigo: articulo.codigo,
      cantidad: cant,
      almacenId: almacen.id,
      almacenNombre: almacen.nombre,
      origenDestino: proveedor || articulo.proveedorPrincipal || 'Proveedor desconocido',
      documento: documento || '',
      observaciones: observaciones || '',
      foto: foto || null
    });
  },

  registrarSalida(articuloId, cantidad, { tecnico, documento, observaciones, firma, foto, almacenId = 'alm-principal' }) {
    const cant = Number(cantidad);
    if (cant <= 0) throw new Error('La cantidad debe ser mayor que 0');

    const almacen = getAlmacen(almacenId);
    const articulos = this.getArticulos();
    const idx = articulos.findIndex(a => a.id === articuloId);
    if (idx === -1) throw new Error('Artículo no encontrado');

    const articulo = articulos[idx];
    articulo.stockPorAlmacen = articulo.stockPorAlmacen || { 'alm-principal': Number(articulo.stockActual) || 0 };
    const disponible = Number(articulo.stockPorAlmacen[almacen.id]) || 0;
    if (disponible < cant) {
      throw new Error(`Stock insuficiente en ${almacen.nombre}. Disponible: ${disponible} ${articulo.unidad}, Solicitado: ${cant} ${articulo.unidad}`);
    }

    articulos[idx].stockPorAlmacen[almacen.id] = disponible - cant;
    articulos[idx].stockActual = sumStock(articulos[idx].stockPorAlmacen);
    storageService.set('ARTICULOS', articulos);

    return this.registrarMovimiento({
      tipo: 'salida',
      articuloId,
      articuloNombre: articulo.nombre,
      codigo: articulo.codigo,
      cantidad: cant,
      almacenId: almacen.id,
      almacenNombre: almacen.nombre,
      origenDestino: tecnico || 'Técnico no especificado',
      documento: documento || '', // OT
      observaciones: observaciones || '',
      firma: firma || null,
      foto: foto || null
    });
  },

  registrarInventario(articuloId, stockFisico, observaciones, almacenId = 'alm-principal') {
    const fisico = Number(stockFisico);
    if (fisico < 0) throw new Error('El stock físico no puede ser negativo');

    const almacen = getAlmacen(almacenId);
    const articulos = this.getArticulos();
    const idx = articulos.findIndex(a => a.id === articuloId);
    if (idx === -1) throw new Error('Artículo no encontrado');

    const articulo = articulos[idx];
    articulo.stockPorAlmacen = articulo.stockPorAlmacen || { 'alm-principal': Number(articulo.stockActual) || 0 };
    const anteriorAlmacen = Number(articulo.stockPorAlmacen[almacen.id]) || 0;
    const diferencia = fisico - anteriorAlmacen;

    if (diferencia === 0) {
      return null; // Sin descuadre, no se registra movimiento
    }

    articulos[idx].stockPorAlmacen[almacen.id] = fisico;
    articulos[idx].stockActual = sumStock(articulos[idx].stockPorAlmacen);
    storageService.set('ARTICULOS', articulos);

    return this.registrarMovimiento({
      tipo: 'ajuste',
      articuloId,
      articuloNombre: articulo.nombre,
      codigo: articulo.codigo,
      cantidad: diferencia, // Será positivo si entra material o negativo si falta
      almacenId: almacen.id,
      almacenNombre: almacen.nombre,
      origenDestino: 'Ajuste de Inventario',
      documento: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      observaciones: observaciones || `Recuento físico en ${almacen.nombre}. Registrado: ${anteriorAlmacen}, Físico: ${fisico}`
    });
  },

  traspasarAlmacen(articuloId, cantidad, origenId, destinoId, observaciones) {
    const cant = Number(cantidad);
    if (cant <= 0) throw new Error('La cantidad debe ser mayor que 0');
    if (!origenId || !destinoId || origenId === destinoId) {
      throw new Error('Selecciona almacenes de origen y destino distintos.');
    }

    const origen = getAlmacen(origenId);
    const destino = getAlmacen(destinoId);
    const articulos = this.getArticulos();
    const idx = articulos.findIndex(a => a.id === articuloId);
    if (idx === -1) throw new Error('Artículo no encontrado');

    const articulo = articulos[idx];
    articulo.stockPorAlmacen = articulo.stockPorAlmacen || { 'alm-principal': Number(articulo.stockActual) || 0 };
    const disponible = Number(articulo.stockPorAlmacen[origen.id]) || 0;
    if (disponible < cant) {
      throw new Error(`Stock insuficiente en ${origen.nombre}. Disponible: ${disponible} ${articulo.unidad}.`);
    }

    articulo.stockPorAlmacen[origen.id] = disponible - cant;
    articulo.stockPorAlmacen[destino.id] = (Number(articulo.stockPorAlmacen[destino.id]) || 0) + cant;
    articulo.stockActual = sumStock(articulo.stockPorAlmacen);
    storageService.set('ARTICULOS', articulos);

    return this.registrarMovimiento({
      tipo: 'traspaso',
      articuloId,
      articuloNombre: articulo.nombre,
      codigo: articulo.codigo,
      cantidad: cant,
      almacenId: `${origen.id}->${destino.id}`,
      almacenNombre: `${origen.nombre} -> ${destino.nombre}`,
      origenDestino: `${origen.nombre} -> ${destino.nombre}`,
      documento: `TR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      observaciones: observaciones || 'Traspaso entre almacenes'
    });
  },

  // --- PEDIDOS ---
  getPedidos() {
    return storageService.get('PEDIDOS');
  },

  crearPedido(pedido) {
    const pedidos = this.getPedidos();
    const total = pedido.articulos.reduce((sum, item) => sum + (item.cantidad * item.precioEstimado), 0);
    const nuevo = {
      id: `ped-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      total,
      estado: 'Borrador',
      ...pedido
    };
    pedidos.push(nuevo);
    storageService.set('PEDIDOS', pedidos);
    addAudit('crear', 'pedido', nuevo.id, null, nuevo);
    return nuevo;
  },

  actualizarPedido(id, data) {
    const pedidos = this.getPedidos();
    const idx = pedidos.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Pedido no encontrado');

    const anterior = pedidos[idx];
    const modificado = { ...anterior, ...data };
    
    // Si hay artículos y cambian, recalculamos total
    if (data.articulos) {
      modificado.total = data.articulos.reduce((sum, item) => sum + (item.cantidad * item.precioEstimado), 0);
    }

    // Si el estado cambia a 'Recibido', cargamos stock automáticamente
    if (data.estado === 'Recibido' && anterior.estado !== 'Recibido') {
      modificado.articulos.forEach(item => {
        try {
          this.registrarEntrada(item.articuloId, item.cantidad, {
            proveedor: modificado.proveedor,
            documento: `PED-${modificado.id}`,
            observaciones: `Recibido de Pedido a Proveedor`
          });
        } catch (e) {
          console.error(`Error al recibir stock de pedido para artículo ${item.articuloId}`, e);
        }
      });
    }

    pedidos[idx] = modificado;
    storageService.set('PEDIDOS', pedidos);
    addAudit('editar', 'pedido', id, anterior, modificado);
    return modificado;
  },

  generarPedidoAutomatico() {
    const articulosBajoStock = this.obtenerStockBajo();
    if (articulosBajoStock.length === 0) {
      throw new Error('No hay artículos por debajo del stock mínimo para pedir.');
    }

    // Agrupar por proveedor principal
    const porProveedor = {};
    articulosBajoStock.forEach(art => {
      const prov = art.proveedorPrincipal || 'Sin Proveedor';
      if (!porProveedor[prov]) porProveedor[prov] = [];
      porProveedor[prov].push(art);
    });

    const pedidosCreados = [];
    Object.keys(porProveedor).forEach(prov => {
      const articulosPedido = porProveedor[prov].map(art => {
        const cantidadPedir = Math.max(art.stockMinimo * 2 - art.stockActual, art.stockMinimo);
        return {
          articuloId: art.id,
          codigo: art.codigo,
          nombre: art.nombre,
          cantidad: cantidadPedir,
          precioEstimado: art.precioEstimado || 0
        };
      });

      const nuevoPed = this.crearPedido({
        proveedor: prov,
        articulos: articulosPedido,
        estado: 'Borrador',
        observaciones: 'Pedido generado automáticamente por rotura de stock mínimo.'
      });
      pedidosCreados.push(nuevoPed);
    });

    return pedidosCreados;
  },

  // --- CONSULTAS Y CÁLCULOS ---
  obtenerMovimientosPorArticulo(articuloId) {
    return this.getMovimientos().filter(m => m.articuloId === articuloId);
  },

  obtenerMovimientosPorTecnico(tecnicoNombre) {
    return this.getMovimientos().filter(m => m.tipo === 'salida' && m.origenDestino === tecnicoNombre);
  },

  obtenerStockBajo() {
    return this.getArticulos().filter(a => a.activo && a.stockActual <= a.stockMinimo);
  },

  calcularValorAlmacen() {
    return this.getArticulos()
      .filter(a => a.activo)
      .reduce((sum, a) => sum + (a.stockActual * (a.precioEstimado || 0)), 0);
  }
};
