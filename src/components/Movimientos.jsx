import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Camera, History, PenTool, Repeat, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { imageService } from '../services/imageService';

const emptyEntrada = {
  articuloId: '',
  proveedor: '',
  cantidad: '',
  documento: '',
  observaciones: '',
  foto: null,
  almacenId: 'alm-principal'
};

const emptySalida = {
  articuloId: '',
  tecnico: '',
  cantidad: '',
  documento: '',
  observaciones: '',
  firma: null,
  foto: null,
  almacenId: 'alm-principal'
};

const emptyTraspaso = {
  articuloId: '',
  cantidad: '',
  origenId: 'alm-principal',
  destinoId: 'alm-electricidad',
  observaciones: ''
};

export default function Movimientos() {
  const {
    articulos,
    tecnicos,
    proveedores,
    almacenes,
    movimientos,
    registrarEntrada,
    registrarSalida,
    traspasarAlmacen,
    currentUser
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState('historial');
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [entrada, setEntrada] = useState(emptyEntrada);
  const [salida, setSalida] = useState(emptySalida);
  const [traspaso, setTraspaso] = useState(emptyTraspaso);
  const [errorForm, setErrorForm] = useState('');

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const articulosActivos = articulos.filter((art) => art.activo);
  const tecnicosActivos = tecnicos.filter((tec) => tec.activo);
  const puedeTraspasar = currentUser?.rol !== 'tecnico';

  useEffect(() => {
    if (activeTabSub === 'salida' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
    }
  }, [activeTabSub]);

  const selectedArticulo = (id) => articulos.find((art) => art.id === id);

  const getPointer = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = event.touches?.[0] || event;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    isDrawingRef.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const point = getPointer(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const point = getPointer(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!canvasRef.current) return;
    isDrawingRef.current = false;
    setSalida((prev) => ({ ...prev, firma: canvasRef.current.toDataURL('image/png') }));
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setSalida((prev) => ({ ...prev, firma: null }));
  };

  const compressFile = async (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = await imageService.compress(file);
    setter((prev) => ({ ...prev, foto: image }));
  };

  const guardarEntrada = (event) => {
    event.preventDefault();
    setErrorForm('');
    try {
      registrarEntrada(entrada.articuloId, entrada.cantidad, entrada);
      setEntrada({ ...emptyEntrada, proveedor: proveedores[0]?.nombre || '' });
      setActiveTabSub('historial');
    } catch (error) {
      setErrorForm(error.message);
    }
  };

  const guardarSalida = (event) => {
    event.preventDefault();
    setErrorForm('');
    if (!salida.firma) {
      setErrorForm('La firma digital es obligatoria para registrar una retirada.');
      return;
    }

    try {
      registrarSalida(salida.articuloId, salida.cantidad, {
        ...salida,
        tecnico: salida.tecnico || currentUser?.tecnicoNombre || currentUser?.nombre
      });
      setSalida({ ...emptySalida, tecnico: tecnicosActivos[0]?.nombre || '' });
      setActiveTabSub('historial');
    } catch (error) {
      setErrorForm(error.message);
    }
  };

  const guardarTraspaso = (event) => {
    event.preventDefault();
    setErrorForm('');
    try {
      traspasarAlmacen(traspaso.articuloId, traspaso.cantidad, traspaso.origenId, traspaso.destinoId, traspaso.observaciones);
      setTraspaso(emptyTraspaso);
      setActiveTabSub('historial');
    } catch (error) {
      setErrorForm(error.message);
    }
  };

  const movimientosFiltrados = movimientos.filter((mov) => {
    const text = `${mov.articuloNombre} ${mov.codigo} ${mov.origenDestino} ${mov.documento} ${mov.almacenNombre}`.toLowerCase();
    return text.includes(busqueda.toLowerCase()) && (tipoFiltro === 'todos' || mov.tipo === tipoFiltro);
  });

  const stockArticuloAlmacen = (articuloId, almacenId) => {
    const art = selectedArticulo(articuloId);
    return Number(art?.stockPorAlmacen?.[almacenId]) || 0;
  };

  const TabButton = ({ id, icon: Icon, label, tone = 'gray' }) => (
    <button
      onClick={() => {
        setActiveTabSub(id);
        setErrorForm('');
      }}
      className={`flex items-center space-x-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
        activeTabSub === id
          ? tone === 'blue'
            ? 'bg-blue-600 text-white'
            : tone === 'rose'
            ? 'bg-rose-600 text-white'
            : tone === 'emerald'
            ? 'bg-emerald-600 text-white'
            : 'bg-white text-gray-900 shadow-xs'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Movimientos de Almacén</h2>
          <p className="mt-1 text-sm text-gray-500">Entradas, retiradas, devoluciones y traspasos con trazabilidad por usuario.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
          <TabButton id="historial" icon={History} label="Historial" />
          <TabButton id="entrada" icon={ArrowDownLeft} label={currentUser?.rol === 'tecnico' ? 'Devolver' : 'Entrada'} tone="blue" />
          <TabButton id="salida" icon={ArrowUpRight} label="Salida" tone="rose" />
          {puedeTraspasar && <TabButton id="traspaso" icon={Repeat} label="Traspaso" tone="emerald" />}
        </div>
      </div>

      {activeTabSub === 'historial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por artículo, documento, usuario o almacén..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-hidden focus:border-amber-500"
              />
            </div>
            <select
              value={tipoFiltro}
              onChange={(event) => setTipoFiltro(event.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-hidden focus:border-amber-500"
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="ajuste">Ajustes</option>
              <option value="traspaso">Traspasos</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
            <div className="hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400">
                  <tr>
                    <th className="px-5 py-4">Fecha</th>
                    <th className="px-5 py-4">Tipo</th>
                    <th className="px-5 py-4">Artículo</th>
                    <th className="px-5 py-4">Cantidad</th>
                    <th className="px-5 py-4">Almacén</th>
                    <th className="px-5 py-4">Responsable</th>
                    <th className="px-5 py-4">Doc.</th>
                    <th className="px-5 py-4">Prueba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movimientosFiltrados.map((mov) => (
                    <tr key={mov.id} className="hover:bg-gray-50/70">
                      <td className="px-5 py-4 text-xs font-semibold text-gray-400">{new Date(mov.fecha).toLocaleString('es-ES')}</td>
                      <td className="px-5 py-4"><TipoBadge tipo={mov.tipo} /></td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900">{mov.articuloNombre}</p>
                        <p className="font-mono text-xs text-gray-400">{mov.codigo}</p>
                      </td>
                      <td className="px-5 py-4 font-black text-gray-900">{mov.tipo === 'entrada' ? '+' : ''}{mov.cantidad}</td>
                      <td className="px-5 py-4 text-gray-700">{mov.almacenNombre || '-'}</td>
                      <td className="px-5 py-4 text-gray-700">{mov.usuario || mov.origenDestino}</td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">{mov.documento || '-'}</td>
                      <td className="px-5 py-4">
                        {(mov.firma || mov.foto) ? (
                          <img src={mov.firma || mov.foto} alt="Prueba movimiento" className="h-10 max-w-28 rounded border border-gray-200 bg-white object-contain" />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {movimientosFiltrados.map((mov) => (
                <article key={mov.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <TipoBadge tipo={mov.tipo} />
                    <span className="text-[10px] font-semibold text-gray-400">{new Date(mov.fecha).toLocaleString('es-ES')}</span>
                  </div>
                  <h3 className="font-black text-gray-900">{mov.articuloNombre}</h3>
                  <p className="font-mono text-xs text-gray-400">{mov.codigo}</p>
                  <div className="mt-3 grid gap-1 text-xs font-semibold text-gray-600">
                    <p>Cantidad: <strong>{mov.tipo === 'entrada' ? '+' : ''}{mov.cantidad}</strong></p>
                    <p>Almacén: <strong>{mov.almacenNombre || '-'}</strong></p>
                    <p>Usuario: <strong>{mov.usuario || '-'}</strong></p>
                    <p>Destino/Origen: <strong>{mov.origenDestino || '-'}</strong></p>
                  </div>
                </article>
              ))}
            </div>

            {movimientosFiltrados.length === 0 && (
              <p className="p-10 text-center text-sm font-semibold text-gray-400">No hay movimientos con ese filtro.</p>
            )}
          </div>
        </div>
      )}

      {activeTabSub === 'entrada' && (
        <FormCard title={currentUser?.rol === 'tecnico' ? 'Registrar devolución de material' : 'Registrar entrada de material'} icon={ArrowDownLeft} tone="blue" error={errorForm}>
          <form onSubmit={guardarEntrada} className="space-y-4">
            <ArticuloSelect value={entrada.articuloId} onChange={(value) => setEntrada({ ...entrada, articuloId: value })} articulos={articulosActivos} />
            <div className="grid gap-4 sm:grid-cols-3">
              <AlmacenSelect label="Almacén destino" value={entrada.almacenId} onChange={(value) => setEntrada({ ...entrada, almacenId: value })} almacenes={almacenes} />
              <label className="block">
                <span className="label-mini">Proveedor / devolución</span>
                <select value={entrada.proveedor} onChange={(event) => setEntrada({ ...entrada, proveedor: event.target.value })} className="field">
                  <option value={currentUser?.rol === 'tecnico' ? currentUser.nombre : ''}>{currentUser?.rol === 'tecnico' ? currentUser.nombre : 'General'}</option>
                  {proveedores.map((prov) => <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>)}
                </select>
              </label>
              <NumberField label="Cantidad" value={entrada.cantidad} onChange={(value) => setEntrada({ ...entrada, cantidad: value })} />
            </div>
            <TextField label="Albarán / documento" value={entrada.documento} onChange={(value) => setEntrada({ ...entrada, documento: value.toUpperCase() })} />
            <PhotoInput label="Foto del albarán o material" image={entrada.foto} onFile={(event) => compressFile(event, setEntrada)} onClear={() => setEntrada((prev) => ({ ...prev, foto: null }))} />
            <Textarea value={entrada.observaciones} onChange={(value) => setEntrada({ ...entrada, observaciones: value })} />
            <FormActions onCancel={() => setActiveTabSub('historial')} submitLabel="Guardar entrada" tone="blue" />
          </form>
        </FormCard>
      )}

      {activeTabSub === 'salida' && (
        <FormCard title="Registrar salida / retirada" icon={ArrowUpRight} tone="rose" error={errorForm}>
          <form onSubmit={guardarSalida} className="space-y-4">
            <ArticuloSelect value={salida.articuloId} onChange={(value) => setSalida({ ...salida, articuloId: value })} articulos={articulosActivos} almacenId={salida.almacenId} />
            <div className="grid gap-4 sm:grid-cols-3">
              <AlmacenSelect label="Almacén origen" value={salida.almacenId} onChange={(value) => setSalida({ ...salida, almacenId: value })} almacenes={almacenes} />
              <label className="block">
                <span className="label-mini">Técnico *</span>
                <select value={salida.tecnico || currentUser?.tecnicoNombre || ''} onChange={(event) => setSalida({ ...salida, tecnico: event.target.value })} className="field" required>
                  <option value="">Selecciona técnico...</option>
                  {tecnicosActivos.map((tec) => <option key={tec.id} value={tec.nombre}>{tec.nombre}</option>)}
                </select>
              </label>
              <NumberField label={`Cantidad (${stockArticuloAlmacen(salida.articuloId, salida.almacenId)} disp.)`} value={salida.cantidad} onChange={(value) => setSalida({ ...salida, cantidad: value })} />
            </div>
            <TextField label="OT / obra" value={salida.documento} onChange={(value) => setSalida({ ...salida, documento: value.toUpperCase() })} />
            <PhotoInput label="Foto de material dañado o evidencia" image={salida.foto} onFile={(event) => compressFile(event, setSalida)} onClear={() => setSalida((prev) => ({ ...prev, foto: null }))} />
            <div>
              <span className="label-mini flex items-center gap-1"><PenTool className="h-3.5 w-3.5 text-amber-500" /> Firma del técnico *</span>
              <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={endDrawing}
                  className="block h-44 w-full touch-none cursor-crosshair"
                />
                <button type="button" onClick={limpiarFirma} className="absolute bottom-2 right-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100">
                  Borrar y repetir
                </button>
              </div>
            </div>
            <Textarea value={salida.observaciones} onChange={(value) => setSalida({ ...salida, observaciones: value })} />
            <FormActions onCancel={() => setActiveTabSub('historial')} submitLabel="Guardar salida" tone="rose" />
          </form>
        </FormCard>
      )}

      {activeTabSub === 'traspaso' && (
        <FormCard title="Traspaso entre almacenes" icon={Repeat} tone="emerald" error={errorForm}>
          <form onSubmit={guardarTraspaso} className="space-y-4">
            <ArticuloSelect value={traspaso.articuloId} onChange={(value) => setTraspaso({ ...traspaso, articuloId: value })} articulos={articulosActivos} />
            <div className="grid gap-4 sm:grid-cols-3">
              <AlmacenSelect label="Origen" value={traspaso.origenId} onChange={(value) => setTraspaso({ ...traspaso, origenId: value })} almacenes={almacenes} />
              <AlmacenSelect label="Destino" value={traspaso.destinoId} onChange={(value) => setTraspaso({ ...traspaso, destinoId: value })} almacenes={almacenes} />
              <NumberField label="Cantidad" value={traspaso.cantidad} onChange={(value) => setTraspaso({ ...traspaso, cantidad: value })} />
            </div>
            <Textarea value={traspaso.observaciones} onChange={(value) => setTraspaso({ ...traspaso, observaciones: value })} />
            <FormActions onCancel={() => setActiveTabSub('historial')} submitLabel="Guardar traspaso" tone="emerald" />
          </form>
        </FormCard>
      )}
    </div>
  );
}

function TipoBadge({ tipo }) {
  const map = {
    entrada: 'bg-blue-100 text-blue-700',
    salida: 'bg-rose-100 text-rose-700',
    ajuste: 'bg-purple-100 text-purple-700',
    traspaso: 'bg-emerald-100 text-emerald-700'
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${map[tipo] || map.ajuste}`}>{tipo}</span>;
}

function FormCard({ title, icon: Icon, tone, error, children }) {
  const color = tone === 'blue' ? 'text-blue-600 bg-blue-50' : tone === 'rose' ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50';
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
      <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
        <span className={`rounded-xl p-2 ${color}`}><Icon className="h-5 w-5" /></span>
        <h3 className="text-lg font-black text-gray-900">{title}</h3>
      </div>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}
      {children}
    </div>
  );
}

function ArticuloSelect({ value, onChange, articulos, almacenId }) {
  return (
    <label className="block">
      <span className="label-mini">Artículo *</span>
      <select required value={value} onChange={(event) => onChange(event.target.value)} className="field font-semibold">
        <option value="">Selecciona un artículo...</option>
        {articulos.map((art) => {
          const stock = almacenId ? Number(art.stockPorAlmacen?.[almacenId]) || 0 : art.stockActual;
          return <option key={art.id} value={art.id}>{art.codigo} - {art.nombre} ({stock} {art.unidad})</option>;
        })}
      </select>
    </label>
  );
}

function AlmacenSelect({ label, value, onChange, almacenes }) {
  return (
    <label className="block">
      <span className="label-mini">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field">
        {almacenes.map((almacen) => <option key={almacen.id} value={almacen.id}>{almacen.nombre}</option>)}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="label-mini">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="field font-mono" />
    </label>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="label-mini">{label} *</span>
      <input required min="1" type="number" value={value} onChange={(event) => onChange(event.target.value)} className="field" />
    </label>
  );
}

function Textarea({ value, onChange }) {
  return (
    <label className="block">
      <span className="label-mini">Observaciones</span>
      <textarea rows="3" value={value} onChange={(event) => onChange(event.target.value)} className="field resize-none" />
    </label>
  );
}

function PhotoInput({ label, image, onFile, onClear }) {
  return (
    <div>
      <span className="label-mini flex items-center gap-1"><Camera className="h-3.5 w-3.5 text-amber-500" /> {label}</span>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600">
          <Camera className="h-4 w-4" />
          Hacer foto
          <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
        </label>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200">
          Elegir archivo
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
      </div>
      {image && (
        <div className="relative mt-2 w-36 rounded-xl border border-gray-200 bg-gray-50 p-2">
          <img src={image} alt={label} className="h-24 w-full rounded-lg object-cover" />
          <button type="button" onClick={onClear} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function FormActions({ onCancel, submitLabel, tone }) {
  const button = tone === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : tone === 'rose' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700';
  return (
    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
      <button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200">
        Cancelar
      </button>
      <button type="submit" className={`rounded-lg px-5 py-2 text-sm font-bold text-white ${button}`}>
        {submitLabel}
      </button>
    </div>
  );
}
