import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Edit, History, Mail, MapPin, Phone, Search, Truck, UserPlus, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function PersonasV2() {
  const {
    tecnicos,
    proveedores,
    articulos,
    movimientos,
    crearTecnico,
    editarTecnico,
    crearProveedor,
    editarProveedor,
    eliminarProveedor,
    sectores
  } = useApp();

  const proveedorInicial = localStorage.getItem('isivolt_selected_provider') || '';
  const [activeTabSub, setActiveTabSub] = useState(proveedorInicial ? 'proveedores' : 'tecnicos');
  const [busqueda, setBusqueda] = useState(proveedorInicial);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [tecHistorial, setTecHistorial] = useState(null);
  const [provDetalle, setProvDetalle] = useState(proveedorInicial ? proveedores.find((p) => p.nombre === proveedorInicial) || null : null);

  const [tecForm, setTecForm] = useState({ nombre: '', seccion: 'Electricidad', telefono: '', email: '', activo: true });
  const [provForm, setProvForm] = useState({ nombre: '', cif: '', telefono: '', email: '', direccion: '', personaContacto: '', observaciones: '' });

  useEffect(() => {
    const seleccionado = localStorage.getItem('isivolt_selected_provider') || '';
    if (seleccionado) {
      setActiveTabSub('proveedores');
      setBusqueda(seleccionado);
      setProvDetalle(proveedores.find((p) => p.nombre === seleccionado) || null);
      localStorage.removeItem('isivolt_selected_provider');
    }
  }, [proveedores]);

  const tecnicosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (activeTabSub !== 'tecnicos') return tecnicos;
    return tecnicos.filter((tec) => `${tec.nombre} ${tec.seccion} ${tec.telefono} ${tec.email}`.toLowerCase().includes(q));
  }, [tecnicos, busqueda, activeTabSub]);

  const proveedoresFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return proveedores;
    return proveedores.filter((prov) => `${prov.nombre} ${prov.cif} ${prov.telefono} ${prov.email} ${prov.personaContacto}`.toLowerCase().includes(q));
  }, [proveedores, busqueda]);

  const getRetiradasTecnico = (nombre) => movimientos.filter((m) => m.tipo === 'salida' && m.origenDestino === nombre);
  const getEntradasProveedor = (nombre) => movimientos.filter((m) => m.tipo === 'entrada' && m.origenDestino === nombre);
  const getArticulosProveedor = (nombre) => articulos.filter((a) => a.proveedorPrincipal === nombre && a.activo !== false);

  const abrirCrear = () => {
    setModoEdicion(false);
    setSeleccionado(null);
    setErrorForm('');
    if (activeTabSub === 'tecnicos') {
      setTecForm({ nombre: '', seccion: 'Electricidad', telefono: '', email: '', activo: true });
    } else {
      setProvForm({ nombre: '', cif: '', telefono: '', email: '', direccion: '', personaContacto: '', observaciones: '' });
    }
    setModalAbierto(true);
  };

  const abrirEditar = (item) => {
    setModoEdicion(true);
    setSeleccionado(item);
    setErrorForm('');
    if (activeTabSub === 'tecnicos') setTecForm({ ...item });
    else setProvForm({ ...item });
    setModalAbierto(true);
  };

  const guardar = (e) => {
    e.preventDefault();
    setErrorForm('');
    try {
      if (activeTabSub === 'tecnicos') {
        if (!tecForm.nombre.trim()) return setErrorForm('El nombre del técnico es obligatorio.');
        modoEdicion ? editarTecnico(seleccionado.id, tecForm) : crearTecnico(tecForm);
      } else {
        if (!provForm.nombre.trim()) return setErrorForm('El nombre del proveedor es obligatorio.');
        modoEdicion ? editarProveedor(seleccionado.id, provForm) : crearProveedor(provForm);
      }
      setModalAbierto(false);
    } catch (err) {
      setErrorForm(err.message || 'No se pudo guardar.');
    }
  };

  const borrarProveedor = (prov) => {
    if (confirm(`¿Eliminar el proveedor "${prov.nombre}"?`)) eliminarProveedor(prov.id);
  };

  const abrirProveedor = (prov) => {
    setProvDetalle(prov);
    setBusqueda(prov.nombre);
    setActiveTabSub('proveedores');
  };

  const limpiarProveedor = () => {
    setProvDetalle(null);
    setBusqueda('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Técnicos & Proveedores</h2>
          <p className="mt-1 text-sm text-gray-500">Acceso rápido a contactos, entregas, materiales asociados y proveedores.</p>
        </div>
        <button onClick={abrirCrear} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-gray-950 hover:bg-amber-400">
          <UserPlus className="h-5 w-5" /> Añadir nuevo
        </button>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-2xl bg-gray-100 p-1">
            <button onClick={() => { setActiveTabSub('tecnicos'); setProvDetalle(null); setBusqueda(''); }} className={`rounded-xl px-4 py-2 text-xs font-black ${activeTabSub === 'tecnicos' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}><Users className="mr-1 inline h-4 w-4" /> Técnicos</button>
            <button onClick={() => { setActiveTabSub('proveedores'); setBusqueda(''); }} className={`rounded-xl px-4 py-2 text-xs font-black ${activeTabSub === 'proveedores' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}><Truck className="mr-1 inline h-4 w-4" /> Proveedores</button>
          </div>
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={activeTabSub === 'proveedores' ? 'Buscar proveedor...' : 'Buscar técnico...'} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-500" />
          </div>
        </div>
      </div>

      {activeTabSub === 'proveedores' && provDetalle && (
        <ProveedorDetalle prov={provDetalle} articulos={getArticulosProveedor(provDetalle.nombre)} entradas={getEntradasProveedor(provDetalle.nombre)} onClose={limpiarProveedor} onEdit={() => abrirEditar(provDetalle)} />
      )}

      {activeTabSub === 'tecnicos' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tecnicosFiltrados.map((tec) => {
            const retiradas = getRetiradasTecnico(tec.nombre);
            return (
              <article key={tec.id} className={`rounded-3xl border bg-white p-5 shadow-xs ${tec.activo ? 'border-gray-100' : 'border-gray-200 opacity-70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-black text-gray-900">{tec.nombre}</h3><p className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">{tec.seccion || 'General'}</p></div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black ${tec.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{tec.activo ? 'Activo' : 'Baja'}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-600">{tec.telefono && <p><Phone className="mr-2 inline h-4 w-4 text-gray-400" />{tec.telefono}</p>}{tec.email && <p className="truncate"><Mail className="mr-2 inline h-4 w-4 text-gray-400" />{tec.email}</p>}<p className="text-xs font-bold text-gray-400">{retiradas.length} retiradas registradas</p></div>
                <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4"><button onClick={() => setTecHistorial(tec)} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-black text-gray-600"><History className="mr-1 inline h-4 w-4" />Historial</button><button onClick={() => abrirEditar(tec)} className="rounded-xl bg-gray-100 p-2 text-gray-500"><Edit className="h-4 w-4" /></button></div>
              </article>
            );
          })}
        </div>
      )}

      {activeTabSub === 'proveedores' && !provDetalle && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {proveedoresFiltrados.map((prov) => {
            const entradas = getEntradasProveedor(prov.nombre);
            const refs = getArticulosProveedor(prov.nombre);
            const criticos = refs.filter((a) => Number(a.stockActual) <= Number(a.stockMinimo));
            return (
              <article key={prov.id} onClick={() => abrirProveedor(prov)} className="cursor-pointer rounded-3xl border border-gray-100 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-gray-900">{prov.nombre}</h3><p className="mt-1 font-mono text-xs font-bold text-gray-400">{prov.cif || 'Sin CIF'}</p></div><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">{entradas.length} entradas</span></div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center"><MiniStat label="Referencias" value={refs.length} /><MiniStat label="Críticos" value={criticos.length} danger={criticos.length > 0} /></div>
                <div className="mt-4 space-y-2 text-sm text-gray-600">{prov.telefono && <p><Phone className="mr-2 inline h-4 w-4 text-gray-400" />{prov.telefono}</p>}{prov.email && <p className="truncate"><Mail className="mr-2 inline h-4 w-4 text-gray-400" />{prov.email}</p>}{prov.personaContacto && <p><Briefcase className="mr-2 inline h-4 w-4 text-gray-400" />{prov.personaContacto}</p>}</div>
                <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4"><button onClick={(e) => { e.stopPropagation(); abrirEditar(prov); }} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-black text-gray-600"><Edit className="mr-1 inline h-4 w-4" />Editar</button><button onClick={(e) => { e.stopPropagation(); borrarProveedor(prov); }} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"><X className="mr-1 inline h-4 w-4" />Borrar</button></div>
              </article>
            );
          })}
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gray-950 px-6 py-4 text-white"><h3 className="font-black">{modoEdicion ? 'Editar' : 'Añadir'} {activeTabSub === 'tecnicos' ? 'técnico' : 'proveedor'}</h3><button onClick={() => setModalAbierto(false)}><X className="h-6 w-6" /></button></div>
            <form onSubmit={guardar} className="space-y-4 p-6">
              {errorForm && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{errorForm}</p>}
              {activeTabSub === 'tecnicos' ? <TecnicoForm form={tecForm} setForm={setTecForm} sectores={sectores} /> : <ProveedorForm form={provForm} setForm={setProvForm} />}
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" onClick={() => setModalAbierto(false)} className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-500">Cancelar</button><button type="submit" className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-black text-gray-950">Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {tecHistorial && <HistorialTecnico tec={tecHistorial} movimientos={getRetiradasTecnico(tecHistorial.nombre)} onClose={() => setTecHistorial(null)} />}
    </div>
  );
}

function ProveedorDetalle({ prov, articulos, entradas, onClose, onEdit }) {
  return <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-xs"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-black uppercase tracking-wider text-amber-600">Proveedor seleccionado</p><h3 className="mt-1 text-2xl font-black text-gray-900">{prov.nombre}</h3><p className="mt-1 font-mono text-xs font-bold text-gray-400">{prov.cif || 'Sin CIF'}</p></div><div className="flex gap-2"><button onClick={onEdit} className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-black text-gray-600"><Edit className="mr-1 inline h-4 w-4" />Editar</button><button onClick={onClose} className="rounded-xl bg-gray-950 px-4 py-2 text-xs font-black text-white">Ver todos</button></div></div><div className="mt-5 grid gap-3 md:grid-cols-4"><MiniStat label="Referencias" value={articulos.length} /><MiniStat label="Stock crítico" value={articulos.filter((a) => Number(a.stockActual) <= Number(a.stockMinimo)).length} danger /><MiniStat label="Entradas" value={entradas.length} /><MiniStat label="Última entrada" value={entradas[0] ? new Date(entradas[0].fecha).toLocaleDateString('es-ES') : '-'} /></div><div className="mt-5 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-gray-50 p-4"><h4 className="font-black text-gray-900">Contacto</h4><div className="mt-3 space-y-2 text-sm text-gray-600">{prov.telefono && <p><Phone className="mr-2 inline h-4 w-4" />{prov.telefono}</p>}{prov.email && <p><Mail className="mr-2 inline h-4 w-4" />{prov.email}</p>}{prov.personaContacto && <p><Briefcase className="mr-2 inline h-4 w-4" />{prov.personaContacto}</p>}{prov.direccion && <p><MapPin className="mr-2 inline h-4 w-4" />{prov.direccion}</p>}</div></div><div className="rounded-2xl bg-gray-50 p-4"><h4 className="font-black text-gray-900">Referencias asociadas</h4><div className="mt-3 max-h-44 space-y-2 overflow-y-auto">{articulos.slice(0, 8).map((art) => <div key={art.id} className="flex justify-between gap-3 rounded-xl bg-white p-2 text-xs"><span className="truncate font-bold text-gray-700">{art.nombre}</span><span className="font-mono font-black text-amber-600">{art.codigo}</span></div>)}{articulos.length === 0 && <p className="text-sm font-bold text-gray-400">Sin artículos asociados.</p>}</div></div></div></section>;
}
function TecnicoForm({ form, setForm, sectores }) { return <><Field label="Nombre *"><input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="field" /></Field><Field label="Sector"><input list="sectores-tecnicos" value={form.seccion} onChange={(e) => setForm({ ...form, seccion: e.target.value })} className="field" /><datalist id="sectores-tecnicos">{sectores.map((s) => <option key={s} value={s} />)}</datalist></Field><div className="grid grid-cols-2 gap-3"><Field label="Teléfono"><input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="field" /></Field><Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" /></Field></div><label className="flex items-center gap-2 text-sm font-bold text-gray-600"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />Técnico activo</label></>; }
function ProveedorForm({ form, setForm }) { return <><Field label="Nombre comercial *"><input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="field" /></Field><div className="grid grid-cols-2 gap-3"><Field label="CIF/NIF"><input value={form.cif} onChange={(e) => setForm({ ...form, cif: e.target.value.toUpperCase() })} className="field font-mono" /></Field><Field label="Contacto"><input value={form.personaContacto} onChange={(e) => setForm({ ...form, personaContacto: e.target.value })} className="field" /></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Teléfono"><input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="field" /></Field><Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" /></Field></div><Field label="Dirección"><input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="field" /></Field><Field label="Observaciones"><textarea rows="2" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="field resize-none" /></Field></>; }
function HistorialTecnico({ tec, movimientos, onClose }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between bg-gray-950 px-6 py-4 text-white"><h3 className="font-black">Consumos de {tec.nombre}</h3><button onClick={onClose}><X className="h-6 w-6" /></button></div><div className="max-h-[60vh] space-y-2 overflow-y-auto p-5">{movimientos.map((m) => <div key={m.id} className="rounded-2xl bg-gray-50 p-3 text-sm"><p className="font-black text-gray-900">{m.articuloNombre}</p><p className="text-xs text-gray-500">{new Date(m.fecha).toLocaleString('es-ES')} · {m.cantidad} uds · {m.documento || 'Sin OT'}</p></div>)}{movimientos.length === 0 && <p className="text-sm font-bold text-gray-400">Sin retiradas.</p>}</div></div></div>; }
function MiniStat({ label, value, danger = false }) { return <div className="rounded-2xl bg-gray-50 p-3 text-center"><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p><p className={`mt-1 text-xl font-black ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</p></div>; }
function Field({ label, children }) { return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-500">{label}</span>{children}</label>; }
