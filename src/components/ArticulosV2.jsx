import { useMemo, useState } from 'react';
import { AlertTriangle, Camera, Edit, MapPin, Package, Plus, QrCode, Save, Search, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { imageService } from '../services/imageService';
import { imageStore } from '../services/imageStore';
import { locationService } from '../services/locationService';

const SECTOR_PREFIX = {
  Electricidad: 'ELE',
  Fontanería: 'FON',
  Fontaneria: 'FON',
  Mecánico: 'MEC',
  Mecanico: 'MEC',
  Albañil: 'ALB',
  Albanil: 'ALB',
  Jardín: 'JAR',
  Jardin: 'JAR',
  Calefactor: 'CAL',
  Clima: 'CLI'
};

const initialForm = {
  codigo: '',
  nombre: '',
  categoria: 'Electricidad',
  unidad: 'ud',
  marca: '',
  modelo: '',
  descripcion: '',
  stockActual: 0,
  stockMinimo: 5,
  ubicacion: '',
  proveedorPrincipal: '',
  foto: null,
  fotoId: null,
  activo: true
};

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function wordCode(nombre = '') {
  const clean = normalize(nombre).replace(/[^A-Z0-9 ]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (!words.length) return 'ART';
  if (words.length === 1) return words[0].slice(0, 3).padEnd(3, 'X');
  return words.slice(0, 3).map((w) => w[0]).join('').padEnd(3, 'X');
}

export default function ArticulosV2() {
  const { articulos, proveedores, sectores, ubicaciones, crearArticulo, editarArticulo } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [sectorFiltro, setSectorFiltro] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ ...initialForm });
  const [error, setError] = useState('');

  const sectoresBase = Array.from(new Set([...(sectores || []), 'Electricidad', 'Fontanería', 'Mecánico', 'Albañil', 'Jardín', 'Calefactor', 'Clima']));

  const codigoSugerido = useMemo(() => generarCodigo(form.categoria, form.nombre, articulos), [form.categoria, form.nombre, articulos]);
  const ubicacionesSugeridas = useMemo(() => locationService.suggestLocations(form.categoria, articulos), [form.categoria, articulos]);

  const articulosFiltrados = articulos.filter((art) => {
    const q = normalize(busqueda);
    const text = normalize(`${art.codigo} ${art.nombre} ${art.categoria} ${art.marca} ${art.modelo} ${art.ubicacion}`);
    return (!q || text.includes(q)) && (!sectorFiltro || art.categoria === sectorFiltro) && art.activo !== false;
  });

  function generarCodigo(sector, nombre, lista) {
    const prefix = SECTOR_PREFIX[sector] || locationService.sectorCode(sector);
    const mid = wordCode(nombre);
    const base = `${prefix}-${mid}`;
    const usados = lista.map((a) => a.codigo).filter(Boolean);
    let n = 1;
    let candidate = `${base}-${String(n).padStart(4, '0')}`;
    while (usados.includes(candidate)) {
      n += 1;
      candidate = `${base}-${String(n).padStart(4, '0')}`;
    }
    return candidate;
  }

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ ...initialForm, proveedorPrincipal: proveedores[0]?.nombre || '' });
    setError('');
    setModal(true);
  };

  const abrirEditar = (art) => {
    setEditando(art);
    setForm({ ...initialForm, ...art, stockActual: Number(art.stockActual) || 0, stockMinimo: Number(art.stockMinimo) || 0 });
    setError('');
    setModal(true);
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const aplicarCodigo = () => setField('codigo', codigoSugerido);

  const handleFoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = await imageService.compress(file, 1024, 0.68);
    setField('foto', image);
  };

  const guardar = async (event) => {
    event.preventDefault();
    setError('');

    const codigoFinal = (form.codigo || codigoSugerido).trim().toUpperCase();
    if (!form.nombre.trim()) {
      setError('El nombre del artículo es obligatorio.');
      return;
    }
    if (!form.categoria.trim()) {
      setError('El sector es obligatorio.');
      return;
    }

    try {
      const payload = {
        ...form,
        codigo: codigoFinal,
        qr: codigoFinal,
        stockActual: Number(form.stockActual) || 0,
        stockMinimo: Number(form.stockMinimo) || 0,
        stockPorAlmacen: editando?.stockPorAlmacen || { 'alm-principal': Number(form.stockActual) || 0 },
        activo: form.activo !== false
      };

      if (form.foto && form.foto.startsWith('data:')) {
        payload.fotoId = await imageStore.save(form.foto, { id: form.fotoId || undefined, tipo: 'articulo' });
        payload.foto = null;
      }

      if (editando) {
        delete payload.stockActual;
        delete payload.stockPorAlmacen;
        editarArticulo(editando.id, payload);
      } else {
        crearArticulo(payload);
      }
      setModal(false);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el artículo.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Catálogo de artículos</h2>
          <p className="mt-1 text-sm text-gray-500">Alta rápida con código automático, ubicación y entrada inicial.</p>
        </div>
        <button onClick={abrirNuevo} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-gray-950 shadow-xs hover:bg-amber-400">
          <Plus className="h-5 w-5" /> Nuevo artículo
        </button>
      </div>

      <div className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-xs md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-500" placeholder="Buscar por código, nombre, marca, modelo o ubicación..." />
        </div>
        <select value={sectorFiltro} onChange={(e) => setSectorFiltro(e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500">
          <option value="">Todos los sectores</option>
          {sectoresBase.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articulosFiltrados.map((art) => {
          const stock = Number(art.stockPorAlmacen?.['alm-principal'] ?? art.stockActual) || 0;
          const bajo = stock <= Number(art.stockMinimo || 0);
          return (
            <article key={art.id} className={`rounded-3xl border bg-white p-5 shadow-xs ${bajo ? 'border-red-100' : 'border-gray-100'}`}>
              <div className="flex items-start gap-4">
                <img src={art.foto || imageService.placeholder(art.nombre)} alt={art.nombre} className="h-16 w-16 rounded-2xl border border-gray-100 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-black text-amber-600">{art.codigo}</p>
                  <h3 className="mt-1 line-clamp-2 font-black text-gray-900">{art.nombre}</h3>
                  <p className="mt-1 text-xs font-semibold text-gray-500">{art.categoria} · {art.ubicacion || 'Sin ubicación'}</p>
                </div>
                <button onClick={() => abrirEditar(art)} className="rounded-xl bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"><Edit className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Info label="Stock" value={stock} danger={bajo} />
                <Info label="Mínimo" value={art.stockMinimo || 0} />
                <Info label="Unidad" value={art.unidad || 'ud'} />
              </div>
            </article>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gray-950 px-6 py-5 text-white">
              <div>
                <h3 className="text-xl font-black">{editando ? 'Editar artículo' : 'Nuevo artículo'}</h3>
                <p className="text-xs font-semibold text-gray-400">El código se genera solo si lo dejas vacío.</p>
              </div>
              <button onClick={() => setModal(false)} className="rounded-xl p-2 text-gray-300 hover:bg-white/10 hover:text-white"><X className="h-6 w-6" /></button>
            </div>

            <form onSubmit={guardar} className="max-h-[calc(92vh-88px)] space-y-5 overflow-y-auto p-6">
              {error && <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700"><AlertTriangle className="h-4 w-4" />{error}</div>}

              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-amber-700">Código automático sugerido</p>
                    <p className="mt-1 font-mono text-xl font-black text-gray-950">{codigoSugerido}</p>
                  </div>
                  <button type="button" onClick={aplicarCodigo} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-xs font-black text-white"><Sparkles className="h-4 w-4 text-amber-400" /> Usar código</button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Código interno" help="Opcional. Si lo dejas vacío, se usa el automático.">
                  <input value={form.codigo} onChange={(e) => setField('codigo', e.target.value.toUpperCase())} placeholder={codigoSugerido} className="field font-mono" />
                </Field>
                <Field label="Nombre artículo *">
                  <input required value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} placeholder="Ej. Bombilla LED E27" className="field" />
                </Field>
                <Field label="Sector *">
                  <select required value={form.categoria} onChange={(e) => setField('categoria', e.target.value)} className="field">
                    {sectoresBase.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                  </select>
                </Field>
                <Field label="Unidad de medida">
                  <select value={form.unidad} onChange={(e) => setField('unidad', e.target.value)} className="field">
                    <option value="ud">Unidades (ud)</option>
                    <option value="metros">Metros</option>
                    <option value="cajas">Cajas</option>
                    <option value="rollos">Rollos</option>
                    <option value="sacos">Sacos</option>
                    <option value="pares">Pares</option>
                  </select>
                </Field>
                <Field label="Marca"><input value={form.marca || ''} onChange={(e) => setField('marca', e.target.value)} className="field" /></Field>
                <Field label="Modelo"><input value={form.modelo || ''} onChange={(e) => setField('modelo', e.target.value)} className="field" /></Field>
                <Field label={editando ? 'Stock actual' : 'Cantidad inicial / entrada inicial'} help={editando ? 'Para cambiar stock usa Entradas/Salidas/Inventario.' : 'Si pones cantidad, se crea la entrada inicial automáticamente.'}>
                  <input disabled={Boolean(editando)} min="0" type="number" inputMode="numeric" value={form.stockActual} onChange={(e) => setField('stockActual', Number(e.target.value))} className="field text-lg font-black disabled:bg-gray-100 disabled:text-gray-400" />
                </Field>
                <Field label="Stock mínimo / alerta"><input min="0" type="number" inputMode="numeric" value={form.stockMinimo} onChange={(e) => setField('stockMinimo', Number(e.target.value))} className="field" /></Field>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-gray-800"><MapPin className="h-4 w-4 text-amber-500" /> Ubicación en almacén principal</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input list="ubicaciones-list" value={form.ubicacion || ''} onChange={(e) => setField('ubicacion', e.target.value.toUpperCase())} placeholder="Ej. ELE-A01-B1" className="field font-mono" />
                  <button type="button" onClick={() => setField('ubicacion', ubicacionesSugeridas[0] || '')} className="rounded-xl bg-amber-500 px-4 py-3 text-xs font-black text-gray-950 hover:bg-amber-400">Sugerir</button>
                </div>
                <datalist id="ubicaciones-list">{[...(ubicaciones || []), ...ubicacionesSugeridas].map((u) => <option key={u} value={u} />)}</datalist>
                <div className="mt-3 flex flex-wrap gap-2">{ubicacionesSugeridas.slice(0, 6).map((u) => <button key={u} type="button" onClick={() => setField('ubicacion', u)} className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-600 ring-1 ring-gray-200 hover:bg-amber-50 hover:text-amber-700">{u}</button>)}</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Proveedor principal"><select value={form.proveedorPrincipal || ''} onChange={(e) => setField('proveedorPrincipal', e.target.value)} className="field"><option value="">Sin proveedor</option>{proveedores.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}</select></Field>
                <Field label="Foto del artículo"><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-black text-gray-950 hover:bg-amber-400"><Camera className="h-4 w-4" /> Hacer/elegir foto<input type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" /></label></Field>
              </div>

              {(form.foto || form.fotoId) && <img src={form.foto || imageService.placeholder(form.nombre)} alt="Vista previa" className="h-36 w-48 rounded-2xl border border-gray-100 object-cover" />}

              <Field label="Descripción"><textarea rows="3" value={form.descripcion || ''} onChange={(e) => setField('descripcion', e.target.value)} className="field resize-none" /></Field>

              <div className="flex flex-col gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setModal(false)} className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-600 hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-black text-white hover:bg-gray-800"><Save className="h-4 w-4 text-amber-400" /> Guardar artículo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, help, children }) {
  return <label className="block"><span className="label-mini">{label}</span>{children}{help && <span className="mt-1 block text-[11px] font-semibold text-gray-400">{help}</span>}</label>;
}

function Info({ label, value, danger = false }) {
  return <div className="rounded-2xl bg-gray-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p><p className={`mt-1 text-lg font-black ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</p></div>;
}
