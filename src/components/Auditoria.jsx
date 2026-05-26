import { useMemo, useState } from 'react';
import { Activity, Clock3, Search, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Auditoria() {
  const { auditoria } = useApp();
  const [busqueda, setBusqueda] = useState('');

  const eventos = useMemo(() => (
    auditoria.filter((entry) => {
      const text = `${entry.accion} ${entry.entidad} ${entry.usuario} ${entry.entidadId}`.toLowerCase();
      return text.includes(busqueda.toLowerCase());
    })
  ), [auditoria, busqueda]);

  const formatJson = (value) => {
    if (!value) return 'Sin datos';
    return JSON.stringify(value, null, 2).slice(0, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-gray-900">
            <ShieldCheck className="h-7 w-7 text-amber-500" />
            Auditoría
          </h2>
          <p className="mt-1 text-sm text-gray-500">Historial de acciones, cambios antes/después y usuario responsable.</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-xs">
          {eventos.length} eventos
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por usuario, entidad o acción..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        {eventos.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black uppercase text-amber-700">{entry.accion}</span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">{entry.entidad}</span>
                  <span className="font-mono text-xs text-gray-400">{entry.entidadId}</span>
                </div>
                <h3 className="mt-3 text-base font-black text-gray-900">{entry.usuario || 'Usuario desconocido'}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {new Date(entry.fecha).toLocaleString('es-ES')}
                </p>
              </div>
              <Activity className="hidden h-5 w-5 text-gray-300 md:block" />
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">Antes</p>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-gray-600">{formatJson(entry.antes)}</pre>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">Después</p>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-gray-600">{formatJson(entry.despues)}</pre>
              </div>
            </div>
          </article>
        ))}
        {eventos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm font-semibold text-gray-400">
            No hay eventos de auditoría con ese filtro.
          </div>
        )}
      </div>
    </div>
  );
}
