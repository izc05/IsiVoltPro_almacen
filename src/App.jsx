import { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import ImageLightbox from './components/ImageLightbox';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Articulos from './components/ArticulosV2';
import Movimientos from './components/MovimientosV2';
import Personas from './components/Personas';
import Pedidos from './components/Pedidos';
import Inventario from './components/Inventario';
import Informes from './components/Informes';
import Auditoria from './components/Auditoria';
import Ajustes from './components/Ajustes';
import RetiradaRapida from './components/RetiradaRapida';

const QRScanner = lazy(() => import('./components/QRScanner'));

function AppContent() {
  const { activeTab, currentUser, hasPermission } = useApp();

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    if (!hasPermission(activeTab)) {
      return <Dashboard />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'qr':
        return (
          <Suspense fallback={<div className="rounded-2xl border border-gray-100 bg-white p-8 text-sm font-bold text-gray-500 shadow-xs">Cargando escáner QR...</div>}>
            <QRScanner />
          </Suspense>
        );
      case 'retirada':
        return <RetiradaRapida />;
      case 'articulos':
        return <Articulos />;
      case 'movimientos':
        return <Movimientos />;
      case 'personas':
        return <Personas />;
      case 'pedidos':
        return <Pedidos />;
      case 'inventario':
        return <Inventario />;
      case 'informes':
        return <Informes />;
      case 'auditoria':
        return <Auditoria />;
      case 'ajustes':
        return <Ajustes />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout>{renderContent()}</Layout>
      <ImageLightbox />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
