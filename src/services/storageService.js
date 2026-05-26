import { DEMO_ARTICLE_IMAGES, DEMO_ARTICULOS, DEMO_TECNICOS, DEMO_PROVEEDORES, DEMO_MOVIMIENTOS, DEMO_PEDIDOS } from '../data/demoData';
import { imageStore } from './imageStore';

export const ROLES = {
  admin: 'Administrador',
  encargado: 'Encargado almacén',
  tecnico: 'Técnico'
};

export const PERMISSIONS = {
  dashboard: ['admin', 'encargado', 'tecnico'],
  qr: ['admin', 'encargado', 'tecnico'],
  articulos: ['admin', 'encargado', 'tecnico'],
  movimientos: ['admin', 'encargado', 'tecnico'],
  personas: ['admin', 'encargado'],
  pedidos: ['admin', 'encargado'],
  inventario: ['admin', 'encargado'],
  informes: ['admin', 'encargado'],
  auditoria: ['admin'],
  ajustes: ['admin']
};

export const DEMO_USUARIOS = [
  {
    id: 'usr-admin',
    nombre: 'Administrador IsiVoltPro',
    usuario: 'admin',
    password: 'admin123',
    rol: 'admin',
    activo: true
  },
  {
    id: 'usr-encargado',
    nombre: 'Encargado Almacén',
    usuario: 'almacen',
    password: 'almacen123',
    rol: 'encargado',
    activo: true
  },
  {
    id: 'usr-tecnico',
    nombre: 'Técnico Demo',
    usuario: 'tecnico',
    password: 'tecnico123',
    rol: 'tecnico',
    tecnicoNombre: 'Carlos Gómez Ruiz',
    activo: true
  }
];

export const DEFAULT_ALMACENES = [
  { id: 'alm-principal', nombre: 'Almacén principal', activo: true },
  { id: 'alm-electricidad', nombre: 'Taller electricidad', activo: true },
  { id: 'alm-fontaneria', nombre: 'Taller fontanería', activo: true },
  { id: 'alm-clima', nombre: 'Taller climatización', activo: true }
];

export const DEFAULT_SECTORES = [
  'Electricidad',
  'Fontanería',
  'Calefacción',
  'Albañilería',
  'Mecánica',
  'Jardinería',
  'Climatización',
  'Mantenimiento',
  'Herramientas',
  'Consumibles',
  'Pintura',
  'Carpintería',
  'Cerrajería'
];

const KEYS = {
  ARTICULOS: 'isivolt_articulos',
  TECNICOS: 'isivolt_tecnicos',
  PROVEEDORES: 'isivolt_proveedores',
  MOVIMIENTOS: 'isivolt_movimientos',
  PEDIDOS: 'isivolt_pedidos',
  AJUSTES: 'isivolt_ajustes',
  USUARIOS: 'isivolt_usuarios',
  CURRENT_USER: 'isivolt_current_user',
  ALMACENES: 'isivolt_almacenes',
  AUDITORIA: 'isivolt_auditoria'
};

const normalizeArticulo = (articulo) => {
  const stockPorAlmacen = articulo.stockPorAlmacen || {
    'alm-principal': Number(articulo.stockActual) || 0,
    'alm-electricidad': 0,
    'alm-fontaneria': 0,
    'alm-clima': 0
  };
  const stockActual = Object.values(stockPorAlmacen).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const foto = articulo.foto || articulo.fotoId
    ? articulo.foto
    : DEMO_ARTICLE_IMAGES[articulo.codigo] || null;

  return {
    ...articulo,
    foto,
    stockPorAlmacen,
    stockActual
  };
};

const normalizeMovimiento = (movimiento) => ({
  ...movimiento,
  almacenId: movimiento.almacenId || 'alm-principal',
  almacenNombre: movimiento.almacenNombre || 'Almacén principal',
  usuario: movimiento.usuario || 'Administrador'
});

export const storageService = {
  init() {
    if (!localStorage.getItem(KEYS.ARTICULOS)) {
      localStorage.setItem(KEYS.ARTICULOS, JSON.stringify(DEMO_ARTICULOS.map(normalizeArticulo)));
    }
    if (!localStorage.getItem(KEYS.TECNICOS)) {
      localStorage.setItem(KEYS.TECNICOS, JSON.stringify(DEMO_TECNICOS));
    }
    if (!localStorage.getItem(KEYS.PROVEEDORES)) {
      localStorage.setItem(KEYS.PROVEEDORES, JSON.stringify(DEMO_PROVEEDORES));
    }
    if (!localStorage.getItem(KEYS.MOVIMIENTOS)) {
      localStorage.setItem(KEYS.MOVIMIENTOS, JSON.stringify(DEMO_MOVIMIENTOS.map(normalizeMovimiento)));
    }
    if (!localStorage.getItem(KEYS.PEDIDOS)) {
      localStorage.setItem(KEYS.PEDIDOS, JSON.stringify(DEMO_PEDIDOS));
    }
    if (!localStorage.getItem(KEYS.AJUSTES)) {
      const defaultAjustes = {
        nombreEmpresa: 'IsiVoltPro S.L.',
        cifEmpresa: 'B-12345678',
        direccion: 'Polígono Industrial Las Palmeras, Nave 4',
        telefono: '900 100 200',
        email: 'info@isivoltpro.com'
      };
      localStorage.setItem(KEYS.AJUSTES, JSON.stringify(defaultAjustes));
    }
    if (!localStorage.getItem(KEYS.USUARIOS)) {
      localStorage.setItem(KEYS.USUARIOS, JSON.stringify(DEMO_USUARIOS));
    }
    if (!localStorage.getItem(KEYS.ALMACENES)) {
      localStorage.setItem(KEYS.ALMACENES, JSON.stringify(DEFAULT_ALMACENES));
    }
    if (!localStorage.getItem(KEYS.AUDITORIA)) {
      localStorage.setItem(KEYS.AUDITORIA, JSON.stringify([]));
    }

    this.migrate();
  },

  migrate() {
    const articulos = JSON.parse(localStorage.getItem(KEYS.ARTICULOS) || '[]');
    if (articulos.some((art) => !art.stockPorAlmacen || (!art.foto && !art.fotoId && DEMO_ARTICLE_IMAGES[art.codigo]))) {
      localStorage.setItem(KEYS.ARTICULOS, JSON.stringify(articulos.map(normalizeArticulo)));
    }

    const movimientos = JSON.parse(localStorage.getItem(KEYS.MOVIMIENTOS) || '[]');
    if (movimientos.some((mov) => !mov.almacenId || !mov.almacenNombre)) {
      localStorage.setItem(KEYS.MOVIMIENTOS, JSON.stringify(movimientos.map(normalizeMovimiento)));
    }
  },

  get(key) {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(KEYS[key]) || '[]');
    } catch (e) {
      console.error(`Error al leer de localStorage: ${key}`, e);
      return [];
    }
  },

  set(key, data) {
    try {
      localStorage.setItem(KEYS[key], JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error al guardar en localStorage: ${key}`, e);
      return false;
    }
  },

  getAjustes() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(KEYS.AJUSTES) || '{}');
    } catch (e) {
      return {};
    }
  },

  getUsuarios() {
    return this.get('USUARIOS');
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.CURRENT_USER) || 'null');
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(KEYS.CURRENT_USER);
      return true;
    }
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    return true;
  },

  getAlmacenes() {
    return this.get('ALMACENES');
  },

  getAuditoria() {
    return this.get('AUDITORIA');
  },

  addAudit(entry) {
    const auditoria = this.getAuditoria();
    auditoria.unshift({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fecha: new Date().toISOString(),
      ...entry
    });
    return this.set('AUDITORIA', auditoria.slice(0, 500));
  },

  async exportJson() {
    const backup = {
      version: 2,
      generatedAt: new Date().toISOString(),
      data: {
        articulos: this.get('ARTICULOS'),
        tecnicos: this.get('TECNICOS'),
        proveedores: this.get('PROVEEDORES'),
        movimientos: this.get('MOVIMIENTOS'),
        pedidos: this.get('PEDIDOS'),
        ajustes: this.getAjustes(),
        usuarios: this.get('USUARIOS'),
        almacenes: this.get('ALMACENES'),
        auditoria: this.get('AUDITORIA'),
        images: await imageStore.all()
      }
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `isivoltpro-almacen-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  },

  async importJson(backup) {
    const data = backup?.data || backup;
    if (!data || !Array.isArray(data.articulos)) {
      throw new Error('La copia JSON no tiene el formato esperado.');
    }

    localStorage.setItem(KEYS.ARTICULOS, JSON.stringify(data.articulos.map(normalizeArticulo)));
    localStorage.setItem(KEYS.TECNICOS, JSON.stringify(data.tecnicos || []));
    localStorage.setItem(KEYS.PROVEEDORES, JSON.stringify(data.proveedores || []));
    localStorage.setItem(KEYS.MOVIMIENTOS, JSON.stringify((data.movimientos || []).map(normalizeMovimiento)));
    localStorage.setItem(KEYS.PEDIDOS, JSON.stringify(data.pedidos || []));
    localStorage.setItem(KEYS.AJUSTES, JSON.stringify(data.ajustes || {}));
    localStorage.setItem(KEYS.USUARIOS, JSON.stringify(data.usuarios || DEMO_USUARIOS));
    localStorage.setItem(KEYS.ALMACENES, JSON.stringify(data.almacenes || DEFAULT_ALMACENES));
    localStorage.setItem(KEYS.AUDITORIA, JSON.stringify(data.auditoria || []));
    await imageStore.importAll(data.images || []);
    this.migrate();
    return true;
  },

  setAjustes(data) {
    try {
      localStorage.setItem(KEYS.AJUSTES, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  },

  clearAll() {
    localStorage.removeItem(KEYS.ARTICULOS);
    localStorage.removeItem(KEYS.TECNICOS);
    localStorage.removeItem(KEYS.PROVEEDORES);
    localStorage.removeItem(KEYS.MOVIMIENTOS);
    localStorage.removeItem(KEYS.PEDIDOS);
    localStorage.removeItem(KEYS.AJUSTES);
    localStorage.removeItem(KEYS.ALMACENES);
    localStorage.removeItem(KEYS.AUDITORIA);
    this.init();
  }
};
