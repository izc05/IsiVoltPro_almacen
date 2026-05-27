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

  const stockBajoCount = articulos.filter(a => a.activo && a.stockActual <= a.stockMinimo).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'qr', label: 'QR rápido', icon: QrCode },
    { id: 'retirada', label: 'Retirada', icon: ArrowUpRight },
    { id: 'articulos', label: 'Artículos', icon: Package, badge: stockBajoCount > 0 ? stockBajoCount : null },
    { id: 'movimientos', label: 'Movimientos', icon: ClipboardList },
    { id: 'personas', label: 'Técnicos & Prov.', icon: Users },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
    { id: 'inventario', label: 'Auditoría', icon: QrCode },
    { id: 'informes', label: 'Informes', icon: FileBarChart2 },
    { id: 'auditoria', label: 'Historial', icon: ShieldCheck },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ].filter((item) => hasPermission(item.id));

  const mobileMenuItems = menuItems.filter((item) => item.id !== 'qr');

  const navigateTo = (tabId) => {
    if (tabId === 'articulos') {
      setCatalogoFiltroSector?.('');
    }
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
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 text-white max-w-md w-[90%] font-medium ${
              notification.tipo === 'error' ? 'bg-red-600' : notification.tipo === 'info' ? 'bg-blue-600' : 'bg-amber-600'
            }`}
          >
            <span className="flex-1 text-center md:text-left">{notification.mensaje}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="md:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md no-print">
      </header>

      <main className={`flex-1 w-full ${mainWidthClass}`}>
        {children}
      </main>
    </div>
  );
}
