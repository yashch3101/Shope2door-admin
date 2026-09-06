import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Auth/Login';
import DashboardLayout from './components/DashboardLayout';
import ProductList from './pages/Products/ProductList';
import OrderList from './pages/Orders/OrderList';
import CategoryList from './pages/Categories/CategoryList';
import CustomerList from './pages/Customers/CustomerList';
import Dashboard from './pages/Dashboard/Dashboard';
import CouponList from './pages/Coupons/CouponList';
import BannerList from './pages/Banners/BannerList';
import Settings from './pages/Settings/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="products" element={<ProductList />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="coupons" element={<CouponList />} />
          <Route path="banners" element={<BannerList />} />
          <Route path="settings" element={<Settings />} />
          {/* Baaki 30+ routes yahan aayenge aage chal kar */}
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}