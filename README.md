# IsiVoltPro Almacén 📦⚡

Sistema premium de gestión de almacén, control de stock e inventario para PC y móviles. Diseñado con una identidad visual moderna en color **ámbar / naranja técnico y gris oscuro**, adaptándose estricta y fluidamente a cualquier tamaño de pantalla sin scroll horizontal.

## Características Principales

1. **Dashboard Completo**: Visualiza métricas generales, alertas de stock bajo mínimo, valor total estimado de almacén e históricos de consumo.
2. **Catálogo de Artículos**: Alta, edición y desactivación de artículos con 14 campos detallados de ficha. Generación e impresión directa de etiquetas QR.
3. **Control de Entradas**: Registra la entrada de stock seleccionando proveedores, indicando albaranes y adjuntando una foto de comprobante.
4. **Control de Salidas**: Registro de retiradas asignando materiales a técnicos y especificando la Orden de Trabajo (OT) con soporte para firma táctil.
5. **Auditoría e Inventario**: Recuentos físicos con cálculo automático de discrepancias y guardado de ajustes de stock.
6. **Pedidos a Proveedores**: Generación automática de reposiciones por stock mínimo y recepción integrada de mercancías.
7. **Informes Profesionales**: Genera reportes de stock, roturas, consumos por técnico/proveedor listos para imprimir en A4 o guardar en PDF.
8. **Exportación e Importación Excel**: Copia de seguridad completa en archivo Excel y carga masiva de artículos, técnicos y proveedores con plantillas predefinidas.
9. **Soporte PWA y Móvil**: Listo para instalar en el móvil como PWA u offline, y preparado con Capacitor para compilar como APK de Android.

---

## Estructura del Proyecto

```text
isivoltpro-almacen/
├── public/
│   ├── favicon.svg          # Logotipo vectorial en color ámbar
│   ├── manifest.webmanifest # Manifiesto PWA para instalación móvil
│   └── sw.js                # Service worker para caché offline
├── src/
│   ├── assets/              # Archivos multimedia del proyecto
│   ├── components/          # Vistas modulares de la interfaz
│   │   ├── Ajustes.jsx      # Copias, importación/exportación y plantilla
│   │   ├── Articulos.jsx    # Catálogo, fichas y etiquetas QR
│   │   ├── Dashboard.jsx    # Resumen de actividad y rankings
│   │   ├── Informes.jsx     # Reportes con estilo A4 para impresión
│   │   ├── Inventario.jsx   # Control y ajustes físicos
│   │   ├── Layout.jsx       # Navegación y responsividad
│   │   ├── Movimientos.jsx  # Formularios con firmas y fotos
│   │   ├── Pedidos.jsx      # Compras y pedido automático
│   │   └── Personas.jsx     # Gestión de Técnicos y Proveedores
│   ├── context/
│   │   └── AppContext.jsx   # Estado global de la aplicación y base de datos
│   ├── data/
│   │   └── demoData.js      # Datos demo para pruebas iniciales
│   ├── services/
│   │   ├── excelService.js  # Conversión y exportación de archivos XLS
│   │   ├── inventoryService.js # Lógica de stock, consumos y compras
│   │   ├── reportService.js # Cálculos y compilación de informes
│   │   └── storageService.js # Acceso local a base de datos en LocalStorage
│   ├── App.css
│   ├── App.jsx              # Gestor de rutas de tab
│   ├── index.css            # Estilos globales y Tailwind CSS v4
│   └── main.jsx             # Punto de entrada de React e inicializador de PWA
├── capacitor.config.json    # Configuración de compilación Capacitor
├── index.html               # Configuración SEO y Metas de pantalla táctil
├── package.json             # Gestión de dependencias
├── tailwind.config.js       # Configuración opcional de Tailwind
└── vite.config.js           # Plugin React y Tailwind CSS v4
```

---

## Instrucciones de Instalación y Ejecución

Sigue estos comandos desde la terminal en Windows:

### 1. Clonar o acceder a la carpeta
```bash
cd isivoltpro-almacen
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Ejecutar en modo desarrollo
```bash
npm run dev
```
Abre la dirección URL indicada (ej. `http://localhost:5173`) en tu navegador.

### 4. Compilar para Producción
```bash
npm run build
```

---

## Preparación para compilar APK Android con Capacitor

La estructura de Capacitor está completamente lista. Si deseas agregar la plataforma Android y compilar la APK, ejecuta:

1. **Compilar el bundle de producción**:
   ```bash
   npm run build
   ```
2. **Inicializar y sincronizar con Android**:
   ```bash
   npx cap sync
   ```
3. **Agregar la plataforma de Android**: (solo la primera vez)
   ```bash
   npx cap add android
   ```
4. **Abrir el proyecto en Android Studio** para generar tu APK firmada:
   ```bash
   npx cap open android
   ```

---

## Cómo subir el proyecto a GitHub

Ejecuta los siguientes comandos paso a paso para subir tu código a un repositorio nuevo en GitHub:

```bash
# 1. Inicializar repositorio de Git
git init

# 2. Agregar los archivos al área de preparación (ignora node_modules automáticamente)
git add .

# 3. Hacer el primer commit
git commit -m "Primera version IsiVoltPro Almacen"

# 4. Crear la rama principal
git branch -M main

# 5. Vincular con tu repositorio de GitHub (reemplaza URL_DEL_REPOSITORIO)
git remote add origin URL_DEL_REPOSITORIO

# 6. Subir el código
git push -u origin main
```
