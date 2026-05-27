import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  History,
  Mail,
  Package,
  Phone,
  QrCode,
  Search,
  ShoppingBag,
  TrendingUp,
  Truck,
  UserCheck,
  Warehouse
} from 'lucide-react';

const sectorStyle = {
  Electricidad: 'from-amber-500 to-orange-600',
  Fontanería: 'from-sky-500 to-blue-600',
  Mecánico: 'from-slate-500 to-gray-800',
  Albañil: 'from-stone-500 to-orange-700',
  Jardín: 'from-lime-500 to-emerald-600',
  Calefactor: 'from-red-500 to-rose-700',
  Clima: 'from-cyan-500 to-indigo-600'
};

const sectorOrden = ['Electricidad', 'Fontanería', 'Mecánico', 'Albañil', 'Jardín', 'Calefactor', 'Clima'];
const pedidoPendiente = (estado = '') => !['recibido', 'cancelado'].includes(String(estado).toLowerCase());

export default function Dashboard() {
  const {
    articulos,
    sectores,
    proveedores,
    pedidos,
    movimientos,
    setActiveTab,
    abrirCatalogoSector,
    generarPedidoAutomatico,
    hasPermission
  } = useApp();

  const activos = articulos.filter((art) => art.activo);
  const totalArticulos = activos.length;
  const stockBajo = activos.filter((art) => Number(art.stockActual) <= Number(art.stockMinimo));
  const unidadesTotales = activos.reduce((sum, art) => sum + (Number(art.stockActual) || 0), 0);

  const ahora = new Date();
  const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const movMes = movimientos.filter((mov) => new Date(mov.fecha) >= primerDiaMes);
  const entradasMes = movMes.filter((mov) => mov.tipo === 'entrada').reduce((sum, mov) => sum + Number(mov.cantidad || 0), 0);
  const salidasMes = movMes.filter((mov) => mov.tipo === 'salida').reduce((sum, mov) => sum + Number(mov.cantidad || 0), 0);

  const sectoresBase = Array.from(new Set([...sectorOrden, ...(sectores || [])]));
  const resumenSectores = sectoresBase
    .map((sector) => {
      const items = activos.filter((art) => art.categoria === sector);
      return {
        sector,
        articulos: items.length,
        unidades: items.reduce((sum, art) => sum + (Number(art.stockActual) || 0), 0),
        alertas: items.filter((art) => Number(art.stockActual) <= Number(art.stockMinimo)).length,
        imagen: items.find((art) => art.foto)?.foto
      };
    })
    .filter((sector) => sector.articulos > 0)
    .sort((a, b) => sectorOrden.indexOf(a.sector) - sectorOrden.indexOf(b.sector));

  const rankingMateriales = {};
  const rankingTecnicos = {};
  movimientos.forEach((mov) => {
    if (mov.tipo !== 'salida') return;
    const key = mov.articuloId || mov.codigo || mov.articuloNombre;
    const art = articulos.find((item) => item.id === mov.articuloId || item.codigo === mov.codigo);
    rankingMateriales[key] = rankingMateriales[key] || {
      nombre: mov.articuloNombre,
      codigo: mov.codigo,
      foto: art?.foto,
      unidad: art?.unidad || 'uds',
      total: 0
    };
    rankingMateriales[key].total += Number(mov.cantidad || 0);
    rankingTecnicos[mov.origenDestino] = (rankingTecnicos[mov.origenDestino] || 0) + Number(mov.cantidad || 0);
  });

  const materialesMasRetirados = Object.values(rankingMateriales).sort((a, b) => b.total - a.total).slice(0, 5);
  const tecnicosMasActivos = Object.entries(rankingTecnicos).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const criticosPorSector = stockBajo.slice(0, 6);
  const pedidosPendientes = (pedidos || []).filter((ped) => pedidoPendiente(ped.estado));

  const proveedorStats = (proveedores || []).map((prov) => {
    const articulosProveedor = activos.filter((art) => art.proveedorPrincipal === prov.nombre);
    const criticos = articulosProveedor.filter((art) => Number(art.stockActual) <= Number(art.stockMinimo));
    const pedidosProv = pedidosPendientes.filter((ped) => ped.proveedor === prov.nombre);
    const ultimaEntrada = movimientos
      .filter((mov) => mov.tipo === 'entrada' && mov.origenDestino === prov.nombre)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
    return {
      ...prov,
      referencias: articulosProveedor.length,
      criticos: criticos.length,
      pedidos: pedidosProv.length,
      ultimaEntrada
    };
  }).sort((a, b) => (b.criticos + b.pedidos) - (a.criticos + a.pedidos)).slice(0, 4);

  return (
    <div className="space-y-7 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gray-950 p-6 text-white shadow-xl lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(245,158,11,0.35),transparent_26%),radial-gradient(circle_at_90%_15%,rgba(251,146,60,0.18),transparent_22%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-200">
              <Warehouse className="h-4 w-4" />
              Almacén principal · 7 sectores · {proveedores?.length || 0} proveedores
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">IsiVoltPro Almacén</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
              Control de materiales por sectores, proveedores y pedidos. Escanea el QR del artículo para registrar entradas, salidas o recuentos en segundos.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setActiveTab('qr')} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-gray-950 shadow-lg shadow-amber-950/20 hover:bg-amber-400">
                <QrCode className="h-5 w-5" />
                Escanear artículo
              </button>
              <button onClick={() => abrirCatalogoSector('')} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15">
                <Search className="h-5 w-5" />
                Buscar material
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Metric title="Referencias" value={totalArticulos} icon={Package} />
            <Metric title="Stock crítico" value={stockBajo.length} icon={AlertTriangle} danger />
            <Metric title="Entradas mes" value={`+${entradasMes}`} icon={ArrowDownLeft} />
            <Metric title="Pedidos abiertos" value={pedidosPendientes.length} icon={Truck} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard icon={QrCode} title="Escanear QR" text="Detecta la referencia y abre acciones rápidas." onClick={() => setActiveTab('qr')} primary />
        <ActionCard icon={ArrowDownLeft} title="Registrar entrada" text="Recepción de material, proveedor y albarán." onClick={() => setActiveTab('movimientos')} />
        <ActionCard icon={Truck} title="Proveedores y pedidos" text="Consulta proveedores, pedidos pendientes y material crítico." onClick={() => setActiveTab('personas')} />
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs lg:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900">Sectores del almacén</h3>
            <p className="text-sm text-gray-500">Un único almacén principal organizado por familias de mantenimiento.</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">{unidadesTotales} unidades totales</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {resumenSectores.map((item) => (
            <button key={item.sector} onClick={() => abrirCatalogoSector(item.sector)} className="group overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
              <div className={`relative h-28 bg-gradient-to-br ${sectorStyle[item.sector] || 'from-gray-500 to-gray-900'}`}>
                {item.imagen && <img src={item.imagen} alt={item.sector} className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen" />}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 text-white">
                  <h4 className="text-lg font-black">{item.sector}</h4>
                  <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-black backdrop-blur">{item.alertas} alertas</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-end justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Referencias</p><p className="text-2xl font-black text-gray-900">{item.articulos}</p></div>
                  <div className="text-right"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Unidades</p><p className="text-2xl font-black text-gray-900">{item.unidades}</p></div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs lg:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-black text-gray-900"><Truck className="h-5 w-5 text-amber-500" /> Proveedores clave</h3>
            <p className="text-sm text-gray-500">Resumen rápido para saber a quién pedir y qué proveedores tienen material crítico.</p>
          </div>
          <button onClick={() => setActiveTab('personas')} className="rounded-xl bg-gray-950 px-4 py-3 text-xs font-black text-white hover:bg-gray-800">Abrir proveedores</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {proveedorStats.map((prov) => (
            <article key={prov.id} className={`rounded-2xl border p-4 ${prov.criticos > 0 ? 'border-amber-200 bg-amber-50/45' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="line-clamp-1 font-black text-gray-900">{prov.nombre}</h4>
                  <p className="mt-1 text-xs font-semibold text-gray-500">{prov.personaContacto || 'Sin contacto asignado'}</p>
                </div>
                <span className="rounded-xl bg-white px-2 py-1 text-xs font-black text-gray-700 ring-1 ring-gray-100">{prov.referencias} refs</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100"><p className="text-[10px] font-black uppercase text-gray-400">Críticos</p><p className={`text-xl font-black ${prov.criticos ? 'text-amber-700' : 'text-gray-900'}`}>{prov.criticos}</p></div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100"><p className="text-[10px] font-black uppercase text-gray-400">Pedidos</p><p className="text-xl font-black text-gray-900">{prov.pedidos}</p></div>
              </div>
              <div className="mt-4 space-y-1 text-xs font-semibold text-gray-500">
                {prov.telefono && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" />{prov.telefono}</p>}
                {prov.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 text-gray-400" />{prov.email}</p>}
                <p className="text-gray-400">Última entrada: {prov.ultimaEntrada ? new Date(prov.ultimaEntrada.fecha).toLocaleDateString('es-ES') : 'sin entradas'}</p>
              </div>
            </article>
          ))}
          {proveedorStats.length === 0 && <p className="rounded-2xl bg-gray-50 p-5 text-sm font-bold text-gray-400">Todavía no hay proveedores registrados.</p>}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs lg:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h3 className="text-lg font-black text-gray-900">Material crítico</h3><p className="text-xs text-gray-500">Artículos bajo mínimo para pedir o revisar.</p></div>
            {hasPermission('pedidos') && <button onClick={generarPedidoAutomatico} className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-gray-950 hover:bg-amber-400"><ShoppingBag className="h-4 w-4" /> Pedido</button>}
          </div>
          <div className="space-y-3">
            {criticosPorSector.map((art) => (
              <div key={art.id} className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/40 p-3">
                {art.foto ? <img src={art.foto} alt={art.nombre} className="h-12 w-12 rounded-xl object-cover" /> : <div className="h-12 w-12 rounded-xl bg-gray-100" />}
                <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-black text-gray-900">{art.nombre}</p><p className="text-xs font-semibold text-gray-500">{art.categoria} · {art.ubicacion} · {art.codigo}</p></div>
                <div className="text-right"><p className="text-sm font-black text-red-700">{art.stockActual}</p><p className="text-[10px] font-bold uppercase text-gray-400">mín. {art.stockMinimo}</p></div>
              </div>
            ))}
            {criticosPorSector.length === 0 && <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">No hay material bajo mínimos.</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs lg:p-6">
          <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-black text-gray-900"><History className="h-5 w-5 text-gray-500" /> Últimos movimientos</h3><button onClick={() => setActiveTab('movimientos')} className="text-xs font-black text-amber-600 hover:text-amber-700">Ver todos</button></div>
          <div className="space-y-3">
            {movimientos.slice(0, 6).map((mov) => (
              <div key={mov.id} className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 p-3">
                <div className="flex min-w-0 items-center gap-3"><span className={`rounded-xl p-2 ${mov.tipo === 'entrada' ? 'bg-blue-100 text-blue-700' : mov.tipo === 'salida' ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-700'}`}>{mov.tipo === 'entrada' ? <ArrowDownLeft className="h-4 w-4" /> : mov.tipo === 'salida' ? <ArrowUpRight className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}</span><div className="min-w-0"><p className="line-clamp-1 text-sm font-black text-gray-900">{mov.articuloNombre}</p><p className="text-xs text-gray-500">{mov.origenDestino} · {new Date(mov.fecha).toLocaleDateString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p></div></div>
                <div className="text-right"><p className={`text-sm font-black ${mov.tipo === 'entrada' ? 'text-blue-700' : mov.tipo === 'salida' ? 'text-rose-700' : 'text-purple-700'}`}>{mov.tipo === 'entrada' ? '+' : mov.tipo === 'salida' ? '-' : ''}{Math.abs(Number(mov.cantidad || 0))}</p><p className="font-mono text-[10px] font-bold text-gray-400">{mov.codigo}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Ranking title="Materiales más retirados" icon={TrendingUp} items={materialesMasRetirados} />
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs lg:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900"><UserCheck className="h-5 w-5 text-amber-500" /> Técnicos con más retiradas</h3>
          <div className="space-y-3">
            {tecnicosMasActivos.map(([nombre, total], index) => (<div key={nombre} className="flex items-center justify-between rounded-2xl border border-gray-100 p-3"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-black text-gray-500">{index + 1}</span><span className="text-sm font-bold text-gray-800">{nombre}</span></div><span className="rounded-xl bg-amber-50 px-3 py-1 text-sm font-black text-amber-700">{total} uds</span></div>))}
            {tecnicosMasActivos.length === 0 && <p className="text-sm text-gray-400">No hay salidas registradas.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value, icon: Icon, danger = false }) {
  return <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><div className={`mb-3 inline-flex rounded-xl p-2 ${danger ? 'bg-red-500/20 text-red-200' : 'bg-amber-400/15 text-amber-200'}`}><Icon className="h-5 w-5" /></div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>;
}

function ActionCard({ icon: Icon, title, text, onClick, primary = false }) {
  return <button onClick={onClick} className={`rounded-3xl p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md ${primary ? 'bg-amber-500 text-gray-950' : 'border border-gray-100 bg-white text-gray-900'}`}><Icon className={`h-7 w-7 ${primary ? 'text-gray-950' : 'text-amber-600'}`} /><h3 className="mt-4 text-lg font-black">{title}</h3><p className={`mt-1 text-sm ${primary ? 'text-gray-900/70' : 'text-gray-500'}`}>{text}</p></button>;
}

function Ranking({ title, icon: Icon, items }) {
  const max = Math.max(...items.map((item) => item.total), 1);
  return <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs lg:p-6"><h3 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900"><Icon className="h-5 w-5 text-amber-500" /> {title}</h3><div className="space-y-3">{items.map((item, index) => (<div key={`${item.codigo}-${item.nombre}`} className="rounded-2xl border border-gray-100 p-3"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="text-sm font-black text-gray-400">#{index + 1}</span>{item.foto ? <img src={item.foto} alt={item.nombre} className="h-11 w-11 rounded-xl object-cover" /> : <span className="h-11 w-11 rounded-xl bg-gray-100" />}<div className="min-w-0"><p className="line-clamp-1 text-sm font-black text-gray-900">{item.nombre}</p><p className="font-mono text-[10px] font-bold text-gray-400">{item.codigo}</p></div></div><span className="rounded-xl bg-gray-100 px-3 py-1 text-sm font-black text-gray-900">{item.total} {item.unidad}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.max(8, (item.total / max) * 100)}%` }} /></div></div>))}{items.length === 0 && <p className="text-sm text-gray-400">No hay salidas registradas.</p>}</div></div>;
}
