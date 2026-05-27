import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Package,
  QrCode,
  Users,
  ShoppingBag,
  ClipboardList,
  FileBarChart2,
  Settings,
  Menu,
  X,
  Bell,
  ShieldCheck,
  LogOut,
  Monitor,
  Smartphone,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children }) {
  const { activeTab, setActiveTab, notification, articulos, currentUser, roles, hasPermission, logout, setCatalogoFiltroSector } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(localStorage.getItem('isivolt_view_mode') || 'auto');

  const stockBajoCount = articulos.filter((a) => a.activo && Number(a.stockActual) <= Number(a.stockMinimo)).length;

  const baseMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'qr', label: 'QR rápido', icon: QrCode },
    { id: 'retirada', label: 'Retirada', icon: ArrowUpRight, force: true },
    { id: 'articulos', label: 'Artículos', icon: Package, badge: stockBajoCount > 0 ? stockBajoCount : null },
    { id: 'movimientos', label: 'Movimientos', icon: ClipboardList },
    { id: 'personas', label: 'Técnicos & Prov.', icon: Users },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
    { id: 'inventario', label: 'Auditoría', icon: QrCode },
    { id: 'informes', label: 'Informes', icon: FileBarChart2 },
    { id: 'auditoria', label: 'Historial', icon: ShieldCheck },
    { id: 'ajustes', label: 'Ajustes', icon: Settings }
  ];

  const menuItems = baseMenuItems.filter((item) => item.force || hasPermission(item.id));
  const mobileMenuItems = menuItems.filter((item) => item.id !== 'qr');

  const navigateTo = (tabId) => {
    if (tabId === 'articulos') setCatalogoFiltroSector?.('');
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const setModoVista = (mode) => {
    setViewMode(mode);
    localStorage.setItem('isivolt_view_mode', mode);
  };

  const mainWidthClass = viewMode === 'mobile'
    ? 'max-w-[430px] mx-auto border-x border-gray-100 bg-white'
    : viewMode === 'pc'
      ? 'min-w-[1120px]'
      : 'max-w-7xl mx-auto';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 text-white max-w-md w-[90%] font-medium ${notification.tipo === 'error' ? 'bg-red-600' : notification.tipo === 'info' ? 'bg-blue-600' : 'bg-amber-600'}`}
          >
            <span className="flex-1 text-center md:text-left">{notification.mensaje}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="md:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md no-print">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500 p-1.5 rounded-lg">
            <QrCode className="h-5 w-5 text-gray-950" />
          </div>
          <span className="font-bold text-lg tracking-wide text-amber-500">IsiVoltPro</span>
          <span className="font-light text-xs text-gray-400">Almacén</span>
        </div>
        <div className="flex items-center space-x-3">
          {stockBajoCount > 0 && <div className="relative"><Bell className="h-5 w-5 text-amber-500" /><span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{stockBajoCount}</span></div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg hover:bg-gray-800 text-gray-300">
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col justify-between transform transition-transform duration-300 ease-in-out no-print md:translate-x-0 md:static md:h-screen md:flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="p-6 border-b border-gray-800 flex items-center space-x-3">
            <div className="bg-amber-500 p-2 rounded-xl shadow-md"><QrCode className="h-6 w-6 text-gray-950" /></div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight text-white m-0 leading-none">IsiVolt<span className="text-amber-500">Pro</span></h1>
              <p className="text-gray-400 text-xs mt-1 uppercase font-semibold tracking-wider">Almacén e Inventario</p>
            </div>
          </div>

          <div className="mx-4 mt-4 rounded-xl border border-gray-800 bg-gray-950/70 p-3">
            <p className="text-sm font-bold text-white">{currentUser?.nombre}</p>
            <p className="mt-1 text-xs font-semibold text-amber-400">{roles[currentUser?.rol] || currentUser?.rol}</p>
          </div>

          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => navigateTo(item.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-left ${isActive ? 'bg-amber-600 text-white font-medium shadow-lg shadow-amber-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white text-amber-700' : 'bg-red-500/20 text-red-400'}`}>{item.badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-950/40 text-center text-xs text-gray-500">
          <div className="mb-3 rounded-xl border border-gray-800 bg-gray-900 p-1">
            <div className="mb-1 px-2 text-left text-[10px] font-black uppercase tracking-wider text-gray-500">Vista</div>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'auto', label: 'Auto', icon: Monitor },
                { id: 'pc', label: 'PC', icon: Monitor },
                { id: 'mobile', label: 'Móvil', icon: Smartphone }
              ].map((item) => {
                const Icon = item.icon;
                return <button key={item.id} onClick={() => setModoVista(item.id)} className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold ${viewMode === item.id ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><Icon className="h-3 w-3" />{item.label}</button>;
              })}
            </div>
          </div>
          <span className="font-medium text-gray-400">IsiVoltPro Almacén</span> v1.0.0
          <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-gray-800"><LogOut className="h-3.5 w-3.5" />Salir</button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden" />}

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden pb-20 md:pb-0">
        <div className={`flex-1 p-4 md:p-8 w-full ${mainWidthClass}`}>{children}</div>
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 text-white h-16 flex items-center justify-around z-30 shadow-lg px-2 no-print">
        {mobileMenuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return <button key={item.id} onClick={() => navigateTo(item.id)} className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl relative ${isActive ? 'text-amber-500' : 'text-gray-400'}`}><Icon className="h-5 w-5" /><span className="text-[10px] mt-1 font-medium tracking-tight truncate max-w-full">{item.label.split(' ')[0]}</span>{item.badge && <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold scale-90">{item.badge}</span>}</button>;
        })}
        <button onClick={() => navigateTo('qr')} className={`flex flex-col items-center justify-center w-14 h-14 -translate-y-4 rounded-full border-4 border-gray-900 shadow-xl relative transition-transform ${activeTab === 'qr' ? 'bg-amber-600 text-white scale-105' : 'bg-amber-500 text-gray-950 hover:bg-amber-600'}`}><QrCode className="h-6 w-6" /></button>
        {mobileMenuItems.slice(5, 8).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return <button key={item.id} onClick={() => navigateTo(item.id)} className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl relative ${isActive ? 'text-amber-500' : 'text-gray-400'}`}><Icon className="h-5 w-5" /><span className="text-[10px] mt-1 font-medium tracking-tight truncate max-w-full">{item.label.split(' ')[0]}</span></button>;
        })}
      </nav>
    </div>
  );
}
