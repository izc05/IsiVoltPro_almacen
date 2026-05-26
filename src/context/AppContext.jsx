import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_SECTORES, DEFAULT_UBICACIONES, PERMISSIONS, ROLES, storageService } from '../services/storageService';
import { inventoryService } from '../services/inventoryService';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Inicializamos el storage
  useEffect(() => {
    storageService.init();
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [articulos, setArticulos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [sectores, setSectores] = useState(DEFAULT_SECTORES);
  const [ubicaciones, setUbicaciones] = useState(DEFAULT_UBICACIONES);
  const [ajustes, setAjustes] = useState({});
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser());
  const [notification, setNotification] = useState(null);

  // Cargar datos al iniciar
  const refrescarDatos = () => {
    setArticulos(inventoryService.getArticulos());
    setTecnicos(inventoryService.getTecnicos());
    setProveedores(inventoryService.getProveedores());
    setMovimientos(inventoryService.getMovimientos());
    setPedidos(inventoryService.getPedidos());
    setUsuarios(storageService.getUsuarios());
    setAlmacenes(storageService.getAlmacenes());
    setAuditoria(storageService.getAuditoria());
    setAjustes(storageService.getAjustes());

    const sectoresBase = storageService.getSectores();
    const usados = [
      ...inventoryService.getArticulos().map((art) => art.categoria),
      ...inventoryService.getTecnicos().map((tec) => tec.seccion)
    ].filter(Boolean);
    setSectores(Array.from(new Set([...sectoresBase, ...usados])).sort((a, b) => a.localeCompare(b, 'es')));

    const ubicacionesBase = storageService.getUbicaciones();
    const ubicacionesUsadas = inventoryService.getArticulos().map((art) => art.ubicacion).filter(Boolean);
    setUbicaciones(Array.from(new Set([...ubicacionesBase, ...ubicacionesUsadas])).sort((a, b) => a.localeCompare(b, 'es')));
  };

  useEffect(() => {
    refrescarDatos();
  }, []);

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotification({ mensaje, tipo });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const hasPermission = (tab = activeTab) => {
    if (!currentUser) return false;
    return (PERMISSIONS[tab] || []).includes(currentUser.rol);
  };

  const login = (usuario, password) => {
    const user = storageService.getUsuarios().find((u) => (
      u.activo && u.usuario.toLowerCase() === usuario.trim().toLowerCase() && u.password === password
    ));
    if (!user) {
      mostrarNotificacion('Usuario o contraseña incorrectos.', 'error');
      return false;
    }
    const sessionUser = {
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
      tecnicoNombre: user.tecnicoNombre
    };
    storageService.setCurrentUser(sessionUser);
    storageService.addAudit({
      accion: 'login',
      entidad: 'sesion',
      entidadId: user.id,
      usuario: user.nombre,
      antes: null,
      despues: { usuario: user.usuario, rol: user.rol }
    });
    setCurrentUser(sessionUser);
    refrescarDatos();
    mostrarNotificacion(`Bienvenido, ${user.nombre}.`);
    return true;
  };

  const logout = () => {
    storageService.addAudit({
      accion: 'logout',
      entidad: 'sesion',
      entidadId: currentUser?.id || 'anon',
      usuario: currentUser?.nombre || 'Usuario',
      antes: null,
      despues: null
    });
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const setTabProtegida = (tab) => {
    if (!currentUser || !(PERMISSIONS[tab] || []).includes(currentUser.rol)) {
      mostrarNotificacion('Tu rol no tiene permisos para abrir esta sección.', 'error');
      return;
    }
    setActiveTab(tab);
  };

  // --- ARTÍCULOS ---
  const handleCrearArticulo = (art) => {
    try {
      const nuevo = inventoryService.crearArticulo(art);
      refrescarDatos();
      mostrarNotificacion(`Artículo "${nuevo.nombre}" creado con éxito.`);
      return nuevo;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleEditarArticulo = (id, data) => {
    try {
      const modificado = inventoryService.editarArticulo(id, data);
      refrescarDatos();
      mostrarNotificacion(`Artículo "${modificado.nombre}" actualizado.`);
      return modificado;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleEliminarArticulo = (id) => {
    try {
      const eliminado = inventoryService.eliminarArticuloLogico(id);
      refrescarDatos();
      mostrarNotificacion(`Artículo "${eliminado.nombre}" desactivado.`);
      return eliminado;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  // --- TÉCNICOS ---
  const handleCrearTecnico = (tec) => {
    try {
      const nuevo = inventoryService.crearTecnico(tec);
      refrescarDatos();
      mostrarNotificacion(`Técnico "${nuevo.nombre}" añadido.`);
      return nuevo;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleEditarTecnico = (id, data) => {
    try {
      const modificado = inventoryService.editarTecnico(id, data);
      refrescarDatos();
      mostrarNotificacion(`Técnico "${modificado.nombre}" actualizado.`);
      return modificado;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  // --- PROVEEDORES ---
  const handleCrearProveedor = (prov) => {
    try {
      const nuevo = inventoryService.crearProveedor(prov);
      refrescarDatos();
      mostrarNotificacion(`Proveedor "${nuevo.nombre}" añadido.`);
      return nuevo;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleEditarProveedor = (id, data) => {
    try {
      const modificado = inventoryService.editarProveedor(id, data);
      refrescarDatos();
      mostrarNotificacion(`Proveedor "${modificado.nombre}" actualizado.`);
      return modificado;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleEliminarProveedor = (id) => {
    try {
      const eliminado = inventoryService.eliminarProveedor(id);
      refrescarDatos();
      mostrarNotificacion(`Proveedor "${eliminado.nombre}" eliminado.`);
      return eliminado;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const guardarListaMaestra = (key, valores) => {
    const limpios = Array.from(new Set(valores.map((valor) => valor.trim()).filter(Boolean)));
    storageService.set(key, limpios);
    return limpios;
  };

  const handleCrearSector = (nombre) => {
    const limpio = nombre.trim();
    if (!limpio) throw new Error('El sector no puede estar vacío.');
    guardarListaMaestra('SECTORES', [...storageService.getSectores(), limpio]);
    storageService.addAudit({ accion: 'crear', entidad: 'sector', entidadId: limpio, usuario: currentUser?.nombre || 'Administrador', antes: null, despues: { nombre: limpio } });
    refrescarDatos();
    mostrarNotificacion(`Sector "${limpio}" creado.`);
  };

  const handleEditarSector = (anterior, nuevo) => {
    const limpio = nuevo.trim();
    if (!limpio) throw new Error('El sector no puede estar vacío.');
    const sectoresActualizados = storageService.getSectores().map((sector) => sector === anterior ? limpio : sector);
    guardarListaMaestra('SECTORES', sectoresActualizados);
    storageService.set('ARTICULOS', inventoryService.getArticulos().map((art) => art.categoria === anterior ? { ...art, categoria: limpio } : art));
    storageService.set('TECNICOS', inventoryService.getTecnicos().map((tec) => tec.seccion === anterior ? { ...tec, seccion: limpio } : tec));
    storageService.addAudit({ accion: 'editar', entidad: 'sector', entidadId: anterior, usuario: currentUser?.nombre || 'Administrador', antes: { nombre: anterior }, despues: { nombre: limpio } });
    refrescarDatos();
    mostrarNotificacion(`Sector "${anterior}" actualizado.`);
  };

  const handleEliminarSector = (nombre) => {
    guardarListaMaestra('SECTORES', storageService.getSectores().filter((sector) => sector !== nombre));
    storageService.set('ARTICULOS', inventoryService.getArticulos().map((art) => art.categoria === nombre ? { ...art, categoria: 'Sin sector' } : art));
    storageService.set('TECNICOS', inventoryService.getTecnicos().map((tec) => tec.seccion === nombre ? { ...tec, seccion: 'Sin sector' } : tec));
    storageService.addAudit({ accion: 'eliminar', entidad: 'sector', entidadId: nombre, usuario: currentUser?.nombre || 'Administrador', antes: { nombre }, despues: null });
    refrescarDatos();
    mostrarNotificacion(`Sector "${nombre}" eliminado.`);
  };

  const handleCrearUbicacion = (nombre) => {
    const limpio = nombre.trim().toUpperCase();
    if (!limpio) throw new Error('La ubicación no puede estar vacía.');
    guardarListaMaestra('UBICACIONES', [...storageService.getUbicaciones(), limpio]);
    storageService.addAudit({ accion: 'crear', entidad: 'ubicacion', entidadId: limpio, usuario: currentUser?.nombre || 'Administrador', antes: null, despues: { nombre: limpio } });
    refrescarDatos();
    mostrarNotificacion(`Ubicación "${limpio}" creada.`);
  };

  const handleEditarUbicacion = (anterior, nuevo) => {
    const limpio = nuevo.trim().toUpperCase();
    if (!limpio) throw new Error('La ubicación no puede estar vacía.');
    const ubicacionesActualizadas = storageService.getUbicaciones().map((ubicacion) => ubicacion === anterior ? limpio : ubicacion);
    guardarListaMaestra('UBICACIONES', ubicacionesActualizadas);
    storageService.set('ARTICULOS', inventoryService.getArticulos().map((art) => art.ubicacion === anterior ? { ...art, ubicacion: limpio } : art));
    storageService.addAudit({ accion: 'editar', entidad: 'ubicacion', entidadId: anterior, usuario: currentUser?.nombre || 'Administrador', antes: { nombre: anterior }, despues: { nombre: limpio } });
    refrescarDatos();
    mostrarNotificacion(`Ubicación "${anterior}" actualizada.`);
  };

  const handleEliminarUbicacion = (nombre) => {
    guardarListaMaestra('UBICACIONES', storageService.getUbicaciones().filter((ubicacion) => ubicacion !== nombre));
    storageService.set('ARTICULOS', inventoryService.getArticulos().map((art) => art.ubicacion === nombre ? { ...art, ubicacion: '' } : art));
    storageService.addAudit({ accion: 'eliminar', entidad: 'ubicacion', entidadId: nombre, usuario: currentUser?.nombre || 'Administrador', antes: { nombre }, despues: null });
    refrescarDatos();
    mostrarNotificacion(`Ubicación "${nombre}" eliminada.`);
  };

  // --- REGISTRO DE MOVIMIENTOS ---
  const handleRegistrarEntrada = (articuloId, cantidad, data) => {
    try {
      const mov = inventoryService.registrarEntrada(articuloId, cantidad, data);
      refrescarDatos();
      mostrarNotificacion(`Entrada registrada: +${cantidad} unidades.`);
      return mov;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleRegistrarSalida = (articuloId, cantidad, data) => {
    try {
      const mov = inventoryService.registrarSalida(articuloId, cantidad, data);
      refrescarDatos();
      mostrarNotificacion(`Salida registrada: -${cantidad} unidades.`);
      return mov;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleRegistrarInventario = (articuloId, stockFisico, observaciones) => {
    try {
      const mov = inventoryService.registrarInventario(articuloId, stockFisico, observaciones);
      refrescarDatos();
      if (mov) {
        mostrarNotificacion(`Ajuste de inventario realizado: ${mov.cantidad > 0 ? '+' : ''}${mov.cantidad} unidades.`);
      } else {
        mostrarNotificacion(`Recuento sin descuadres para el artículo.`);
      }
      return mov;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleRegistrarInventarioAlmacen = (articuloId, stockFisico, observaciones, almacenId) => {
    try {
      const mov = inventoryService.registrarInventario(articuloId, stockFisico, observaciones, almacenId);
      refrescarDatos();
      mostrarNotificacion(mov ? 'Ajuste de inventario por almacén realizado.' : 'Recuento sin descuadres.');
      return mov;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleTraspasarAlmacen = (articuloId, cantidad, origenId, destinoId, observaciones) => {
    try {
      const mov = inventoryService.traspasarAlmacen(articuloId, cantidad, origenId, destinoId, observaciones);
      refrescarDatos();
      mostrarNotificacion('Traspaso entre almacenes registrado.');
      return mov;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  // --- PEDIDOS ---
  const handleCrearPedido = (ped) => {
    try {
      const nuevo = inventoryService.crearPedido(ped);
      refrescarDatos();
      mostrarNotificacion(`Pedido a ${nuevo.proveedor} creado.`);
      return nuevo;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleActualizarPedido = (id, data) => {
    try {
      const mod = inventoryService.actualizarPedido(id, data);
      refrescarDatos();
      mostrarNotificacion(`Pedido actualizado. Estado: ${mod.estado}`);
      return mod;
    } catch (e) {
      mostrarNotificacion(e.message, 'error');
      throw e;
    }
  };

  const handleGenerarPedidoAutomatico = () => {
    try {
      const pedidosCreados = inventoryService.generarPedidoAutomatico();
      refrescarDatos();
      mostrarNotificacion(`Generados ${pedidosCreados.length} pedidos automáticos para artículos bajo mínimos.`);
      return pedidosCreados;
    } catch (e) {
      mostrarNotificacion(e.message, 'info');
      throw e;
    }
  };

  // --- AJUSTES Y BACKUP ---
  const handleGuardarAjustes = (data) => {
    const exito = storageService.setAjustes(data);
    if (exito) {
      refrescarDatos();
      mostrarNotificacion('Ajustes de empresa actualizados.');
    } else {
      mostrarNotificacion('Error al guardar ajustes.', 'error');
    }
  };

  const handleRestablecerBD = () => {
    storageService.clearAll();
    refrescarDatos();
    mostrarNotificacion('Base de datos restablecida con datos demo.', 'info');
  };

  const handleExportarJson = async () => {
    await storageService.exportJson();
    storageService.addAudit({
      accion: 'exportar',
      entidad: 'backup-json',
      entidadId: 'local',
      usuario: currentUser?.nombre || 'Administrador',
      antes: null,
      despues: { fecha: new Date().toISOString() }
    });
    refrescarDatos();
    mostrarNotificacion('Copia JSON completa exportada.');
  };

  const handleImportarJson = async (backup) => {
    await storageService.importJson(backup);
    storageService.addAudit({
      accion: 'importar',
      entidad: 'backup-json',
      entidadId: 'local',
      usuario: currentUser?.nombre || 'Administrador',
      antes: null,
      despues: { fecha: new Date().toISOString() }
    });
    refrescarDatos();
    mostrarNotificacion('Copia JSON restaurada correctamente.', 'info');
  };

  const handleReemplazarBaseDatos = (nuevosArticulos, nuevosTecnicos, nuevosProveedores) => {
    if (nuevosArticulos && nuevosArticulos.length > 0) {
      storageService.set('ARTICULOS', nuevosArticulos);
    }
    if (nuevosTecnicos && nuevosTecnicos.length > 0) {
      storageService.set('TECNICOS', nuevosTecnicos);
    }
    if (nuevosProveedores && nuevosProveedores.length > 0) {
      storageService.set('PROVEEDORES', nuevosProveedores);
    }
    refrescarDatos();
    mostrarNotificacion('Datos importados con éxito.');
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab: setTabProtegida,
      articulos,
      tecnicos,
      proveedores,
      movimientos,
      pedidos,
      usuarios,
      almacenes,
      auditoria,
      sectores,
      ubicaciones,
      ajustes,
      currentUser,
      roles: ROLES,
      permissions: PERMISSIONS,
      notification,
      login,
      logout,
      hasPermission,
      mostrarNotificacion,
      crearArticulo: handleCrearArticulo,
      editarArticulo: handleEditarArticulo,
      eliminarArticulo: handleEliminarArticulo,
      crearTecnico: handleCrearTecnico,
      editarTecnico: handleEditarTecnico,
      crearProveedor: handleCrearProveedor,
      editarProveedor: handleEditarProveedor,
      eliminarProveedor: handleEliminarProveedor,
      crearSector: handleCrearSector,
      editarSector: handleEditarSector,
      eliminarSector: handleEliminarSector,
      crearUbicacion: handleCrearUbicacion,
      editarUbicacion: handleEditarUbicacion,
      eliminarUbicacion: handleEliminarUbicacion,
      registrarEntrada: handleRegistrarEntrada,
      registrarSalida: handleRegistrarSalida,
      registrarInventario: handleRegistrarInventario,
      registrarInventarioAlmacen: handleRegistrarInventarioAlmacen,
      traspasarAlmacen: handleTraspasarAlmacen,
      crearPedido: handleCrearPedido,
      actualizarPedido: handleActualizarPedido,
      generarPedidoAutomatico: handleGenerarPedidoAutomatico,
      guardarAjustes: handleGuardarAjustes,
      restablecerBD: handleRestablecerBD,
      exportarJson: handleExportarJson,
      importarJson: handleImportarJson,
      reemplazarBaseDatos: handleReemplazarBaseDatos,
      refrescarDatos
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  return context;
}
