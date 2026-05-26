export const DEMO_ARTICLE_IMAGES = {
  "IV-CABLE-01": "/demo-articles/cable-3g25.svg",
  "IV-MAGN-20": "/demo-articles/magnetotermico.svg",
  "IV-DIFE-40": "/demo-articles/diferencial.svg",
  "IV-FOCO-50": "/demo-articles/foco-led.svg",
  "IV-CANAL-02": "/demo-articles/canaleta.svg",
  "IV-PINZA-01": "/demo-articles/pinza-amperimetrica.svg",
  "IV-TUBO-16": "/demo-articles/tubo-corrugado.svg",
  "IV-PULS-01": "/demo-articles/pulsador-emergencia.svg",
  "IV-CINTA-NE": "/demo-articles/cinta-aislante.svg",
  "IV-CONT-25": "/demo-articles/contactor.svg"
};

export const DEMO_ARTICULOS = [
  {
    id: "art-1",
    codigo: "IV-CABLE-01",
    qr: "IV-CABLE-01",
    nombre: "Cable Manguera Libre Halógenos 3G2.5",
    categoria: "Electricidad",
    marca: "General Cable",
    modelo: "Exzhellent-X 750V",
    descripcion: "Cable unipolar de cobre clase 5 para instalaciones protegidas.",
    unidad: "metros",
    stockActual: 320,
    stockMinimo: 100,
    ubicacion: "A-01-B2",
    proveedorPrincipal: "Sonepar España",
    foto: DEMO_ARTICLE_IMAGES["IV-CABLE-01"],
    activo: true
  },
  {
    id: "art-2",
    codigo: "IV-MAGN-20",
    qr: "IV-MAGN-20",
    nombre: "Magnetotérmico 2P 16A Curva C 6kA",
    categoria: "Electricidad",
    marca: "Schneider Electric",
    modelo: "Resi9 R9F34216",
    descripcion: "Interruptor automático magnetotérmico modular.",
    unidad: "ud",
    stockActual: 15,
    stockMinimo: 20, // Bajo stock
    ubicacion: "B-03-A1",
    proveedorPrincipal: "Sonepar España",
    foto: DEMO_ARTICLE_IMAGES["IV-MAGN-20"],
    activo: true
  },
  {
    id: "art-3",
    codigo: "IV-DIFE-40",
    qr: "IV-DIFE-40",
    nombre: "Diferencial 2P 40A 30mA AC",
    categoria: "Electricidad",
    marca: "Schneider Electric",
    modelo: "Acti9 iID",
    descripcion: "Interruptor diferencial clase AC para protección de personas.",
    unidad: "ud",
    stockActual: 8,
    stockMinimo: 10, // Bajo stock
    ubicacion: "B-03-A2",
    proveedorPrincipal: "Saltoki",
    foto: DEMO_ARTICLE_IMAGES["IV-DIFE-40"],
    activo: true
  },
  {
    id: "art-4",
    codigo: "IV-FOCO-50",
    qr: "IV-FOCO-50",
    nombre: "Proyector LED Outdoor 50W IP65",
    categoria: "Electricidad",
    marca: "Philips",
    modelo: "Ledinaire BVP154",
    descripcion: "Foco proyector LED gris neutro para exteriores.",
    unidad: "ud",
    stockActual: 25,
    stockMinimo: 5,
    ubicacion: "C-01-C3",
    proveedorPrincipal: "Saltoki",
    foto: DEMO_ARTICLE_IMAGES["IV-FOCO-50"],
    activo: true
  },
  {
    id: "art-5",
    codigo: "IV-CANAL-02",
    qr: "IV-CANAL-02",
    nombre: "Canaleta PVC Adhesiva 20x10x2000mm",
    categoria: "Albañilería",
    marca: "Unex",
    modelo: "78310-2",
    descripcion: "Canal con tapa exterior y banda adhesiva para distribución.",
    unidad: "metros",
    stockActual: 180,
    stockMinimo: 50,
    ubicacion: "A-04-A1",
    proveedorPrincipal: "Rexel España",
    foto: DEMO_ARTICLE_IMAGES["IV-CANAL-02"],
    activo: true
  },
  {
    id: "art-6",
    codigo: "IV-PINZA-01",
    qr: "IV-PINZA-01",
    nombre: "Pinza Amperimétrica Digital AC/DC 600V",
    categoria: "Mecánica",
    marca: "Fluke",
    modelo: "Fluke 323",
    descripcion: "Medida de corriente CA de 400 A y tensión CA/CC.",
    unidad: "ud",
    stockActual: 3,
    stockMinimo: 2,
    ubicacion: "D-02-B1",
    proveedorPrincipal: "Fluke Direct",
    foto: DEMO_ARTICLE_IMAGES["IV-PINZA-01"],
    activo: true
  },
  {
    id: "art-7",
    codigo: "IV-TUBO-16",
    qr: "IV-TUBO-16",
    nombre: "Tubo Corrugado PVC Ø16mm Blindado",
    categoria: "Albañilería",
    marca: "Aiscan",
    modelo: "CR-16",
    descripcion: "Tubo curvable transversalmente elástico reforzado.",
    unidad: "metros",
    stockActual: 500,
    stockMinimo: 100,
    ubicacion: "A-02-D1",
    proveedorPrincipal: "Saltoki",
    foto: DEMO_ARTICLE_IMAGES["IV-TUBO-16"],
    activo: true
  },
  {
    id: "art-8",
    codigo: "IV-PULS-01",
    qr: "IV-PULS-01",
    nombre: "Pulsador de Emergencia Seta 40mm Llave",
    categoria: "Electricidad",
    marca: "Schneider Electric",
    modelo: "Harmony XB5",
    descripcion: "Pulsador de parada de emergencia con desbloqueo por llave.",
    unidad: "ud",
    stockActual: 4,
    stockMinimo: 5, // Bajo stock
    ubicacion: "B-04-C1",
    proveedorPrincipal: "Rexel España",
    foto: DEMO_ARTICLE_IMAGES["IV-PULS-01"],
    activo: true
  },
  {
    id: "art-9",
    codigo: "IV-CINTA-NE",
    qr: "IV-CINTA-NE",
    nombre: "Cinta Aislante Negra 19mm x 20m",
    categoria: "Consumibles",
    marca: "3M",
    modelo: "Temflex 1500",
    descripcion: "Cinta aislante de vinilo retardante de llama de buena calidad.",
    unidad: "ud",
    stockActual: 120,
    stockMinimo: 30,
    ubicacion: "E-01-A1",
    proveedorPrincipal: "Saltoki",
    foto: DEMO_ARTICLE_IMAGES["IV-CINTA-NE"],
    activo: true
  },
  {
    id: "art-10",
    codigo: "IV-CONT-25",
    qr: "IV-CONT-25",
    nombre: "Contactor AC3 3P 25A Bobina 230Vac",
    categoria: "Electricidad",
    marca: "Lovato Electric",
    modelo: "BF2510A230",
    descripcion: "Contactor tripolar para maniobra de motores.",
    unidad: "ud",
    stockActual: 2,
    stockMinimo: 6, // Bajo stock
    ubicacion: "B-03-B2",
    proveedorPrincipal: "Rexel España",
    foto: DEMO_ARTICLE_IMAGES["IV-CONT-25"],
    activo: true
  }
];

export const DEMO_TECNICOS = [
  { id: "tec-1", nombre: "Carlos Gómez Ruiz", seccion: "Electricidad", telefono: "600111222", email: "carlos.gomez@isivoltpro.com", activo: true },
  { id: "tec-2", nombre: "Ana Martínez López", seccion: "Climatización", telefono: "600333444", email: "ana.martinez@isivoltpro.com", activo: true },
  { id: "tec-3", nombre: "Francisco Javier Soler", seccion: "Fontanería", telefono: "600555666", email: "javier.soler@isivoltpro.com", activo: true },
  { id: "tec-4", nombre: "Marta Sánchez Ortiz", seccion: "Jardinería", telefono: "600777888", email: "marta.sanchez@isivoltpro.com", activo: true },
  { id: "tec-5", nombre: "Jesús Manuel Pérez", seccion: "Albañilería", telefono: "600999000", email: "jesus.perez@isivoltpro.com", activo: false }
];

export const DEMO_PROVEEDORES = [
  { id: "prov-1", nombre: "Sonepar España", cif: "A82749910", telefono: "914800000", email: "pedidos@sonepar.es", direccion: "Avda. de la Astronomía, 23, San Fernando de Henares (Madrid)", personaContacto: "Roberto Castro", observaciones: "Proveedor principal de material eléctrico y conductores." },
  { id: "prov-2", nombre: "Saltoki", cif: "B31048891", telefono: "948293040", email: "almacen@saltoki.com", direccion: "Ctra. Zaragoza, km 3, Pamplona (Navarra)", personaContacto: "Elena Ruiz", observaciones: "Entregas muy rápidas. Tienen material de fontanería y clima también." },
  { id: "prov-3", nombre: "Rexel España", cif: "A28004510", telefono: "912040500", email: "comercial@rexel.es", direccion: "P.I. San Fernando, Calle C, Coslada (Madrid)", personaContacto: "Alberto Sancho", observaciones: "Buen catálogo en aparamenta industrial Schneider." },
  { id: "prov-4", nombre: "Fluke Direct", cif: "N0023491C", telefono: "900994400", email: "soporte@fluke.es", direccion: "Edificio Fluke, Eindhoven, Países Bajos", personaContacto: "Hans De Vries", observaciones: "Proveedor oficial de equipos de medida Fluke." }
];

export const DEMO_MOVIMIENTOS = [
  {
    id: "mov-1",
    fecha: "2026-05-20T10:30:00.000Z",
    tipo: "entrada",
    articuloId: "art-1",
    articuloNombre: "Cable Manguera Libre Halógenos 3G2.5",
    codigo: "IV-CABLE-01",
    cantidad: 100,
    origenDestino: "Sonepar España",
    documento: "ALB-88392",
    observaciones: "Entrada por compra programada",
    usuario: "Administrador"
  },
  {
    id: "mov-2",
    fecha: "2026-05-21T08:15:00.000Z",
    tipo: "salida",
    articuloId: "art-1",
    articuloNombre: "Cable Manguera Libre Halógenos 3G2.5",
    codigo: "IV-CABLE-01",
    cantidad: 40,
    origenDestino: "Carlos Gómez Ruiz",
    documento: "OT-2026/894",
    observaciones: "Instalación planta 2 nave C",
    usuario: "Administrador",
    firma: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='30'><path d='M10 20 Q 30 5, 50 20 T 90 20' stroke='black' fill='none'/></svg>"
  },
  {
    id: "mov-3",
    fecha: "2026-05-22T14:45:00.000Z",
    tipo: "salida",
    articuloId: "art-2",
    articuloNombre: "Magnetotérmico 2P 16A Curva C 6kA",
    codigo: "IV-MAGN-20",
    cantidad: 5,
    origenDestino: "Ana Martínez López",
    documento: "OT-2026/902",
    observaciones: "Cuadro secundario oficinas",
    usuario: "Administrador"
  },
  {
    id: "mov-4",
    fecha: "2026-05-23T11:00:00.000Z",
    tipo: "entrada",
    articuloId: "art-3",
    articuloNombre: "Diferencial 2P 40A 30mA AC",
    codigo: "IV-DIFE-40",
    cantidad: 2,
    origenDestino: "Saltoki",
    documento: "ALB-99018",
    observaciones: "Reposición stock crítico",
    usuario: "Administrador"
  },
  {
    id: "mov-5",
    fecha: "2026-05-24T09:00:00.000Z",
    tipo: "ajuste",
    articuloId: "art-10",
    articuloNombre: "Contactor AC3 3P 25A Bobina 230Vac",
    codigo: "IV-CONT-25",
    cantidad: -1,
    origenDestino: "Ajuste de inventario",
    documento: "INV-2026-05",
    observaciones: "Descuadre en recuento físico (registrado 3, físico 2)",
    usuario: "Administrador"
  }
];

export const DEMO_PEDIDOS = [
  {
    id: "ped-1",
    fecha: "2026-05-18",
    proveedor: "Sonepar España",
    articulos: [
      { articuloId: "art-2", codigo: "IV-MAGN-20", nombre: "Magnetotérmico 2P 16A Curva C 6kA", cantidad: 10 }
    ],
    total: 0,
    estado: "Recibido"
  },
  {
    id: "ped-2",
    fecha: "2026-05-25",
    proveedor: "Saltoki",
    articulos: [
      { articuloId: "art-3", codigo: "IV-DIFE-40", nombre: "Diferencial 2P 40A 30mA AC", cantidad: 5 },
      { articuloId: "art-10", codigo: "IV-CONT-25", nombre: "Contactor AC3 3P 25A Bobina 230Vac", cantidad: 6 }
    ],
    total: 0,
    estado: "Enviado"
  }
];
