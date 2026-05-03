import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import AdminPanel from './pages/AdminPanel';
import AdminSupport from './components/AdminSupport';
import ChatWidget from './components/ChatWidget';
import './App.css';

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/products" className="navbar-brand">
          TechCore
        </Link>
        
        <div className="navbar-links">
          <Link to="/products" className={isActive('/products')}>
            Каталог
          </Link>
          
          {user.role !== 'GUEST' && (
            <Link to="/orders" className={isActive('/orders')}>
              Заказы
            </Link>
          )}
          
          {isAdmin && (
            <>
              <Link to="/admin" className={isActive('/admin')}>
                Админ-панель
              </Link>
              <Link to="/admin/support" className={isActive('/admin/support')}>
                Поддержка
              </Link>
            </>
          )}
        </div>

        <div className="user-info">
          <span>
            {user.username || user.email}
            {user.role === 'ADMIN' && ' (Админ)'}
          </span>
          <button className="btn btn-secondary" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/products" replace />;
  }

  return children;
}

// ✅ ОДНА объединённая функция AppContent
function AppContent() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/products" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/products" /> : <Register />} />
        
        <Route path="/products" element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <AdminPanel />
          </ProtectedRoute>
        } />

        <Route path="/admin/support" element={
          <ProtectedRoute adminOnly={true}>
            <AdminSupport />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
      {user && <ChatWidget />}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}