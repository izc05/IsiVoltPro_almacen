import { useState } from 'react';
import { LockKeyhole, PackageCheck, ShieldCheck, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const [usuario, setUsuario] = useState('admin');
  const [password, setPassword] = useState('admin123');

  const submit = (event) => {
    event.preventDefault();
    login(usuario, password);
  };

  const usarDemo = (user, pass) => {
    setUsuario(user);
    setPassword(pass);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white grid lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative flex min-h-[46vh] flex-col justify-between overflow-hidden p-8 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_28%),linear-gradient(135deg,#111827,#020617)]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="rounded-xl bg-amber-500 p-2 text-gray-950 shadow-lg">
            <PackageCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="m-0 text-2xl font-black tracking-tight">
              IsiVolt<span className="text-amber-400">Pro</span> Almacén
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Inventario profesional</p>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl py-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">
            <ShieldCheck className="h-4 w-4" />
            Control local con roles y auditoría
          </div>
          <h2 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Gestión de almacén rápida, móvil y con trazabilidad.
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {['Multi-almacén', 'Firmas y fotos', 'Backups JSON'].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-gray-100">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-gray-50 p-6 text-gray-900">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight">Acceso privado</h2>
            <p className="mt-1 text-sm text-gray-500">Inicia sesión con un usuario local demo.</p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Usuario</span>
              <div className="relative">
                <UserRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  value={usuario}
                  onChange={(event) => setUsuario(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm font-semibold outline-hidden focus:border-amber-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Contraseña</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm font-semibold outline-hidden focus:border-amber-500"
                />
              </div>
            </label>
          </div>

          <button className="mt-6 w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-amber-600">
            Entrar al almacén
          </button>

          <div className="mt-5 grid gap-2 text-xs font-bold sm:grid-cols-3">
            <button type="button" onClick={() => usarDemo('admin', 'admin123')} className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200">
              Admin
            </button>
            <button type="button" onClick={() => usarDemo('almacen', 'almacen123')} className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200">
              Encargado
            </button>
            <button type="button" onClick={() => usarDemo('tecnico', 'tecnico123')} className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200">
              Técnico
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
