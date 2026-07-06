import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { useEffect, lazy, Suspense } from 'react';
import { linkWitnessAfterRegister } from './api/witness';

// Route-level code splitting — each page ships as its own chunk so the initial
// load stays light and navigation streams in on demand (SKILL §5 performance).
const Home = lazy(() => import('./pages/Home'));
const Browse = lazy(() => import('./pages/Browse'));
const ProviderProfile = lazy(() => import('./pages/ProviderProfile'));
const BookingForm = lazy(() => import('./pages/BookingForm'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const WitnessVouch = lazy(() => import('./pages/WitnessVouch'));
const NotFound = lazy(() => import('./pages/NotFound'));
const JobListings = lazy(() => import('./pages/JobListings'));
const PostJob = lazy(() => import('./pages/PostJob'));

// After login, if a witness_token redirect param exists, link it to the user
function WitnessLinkBridge() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('witness_token');
  useEffect(() => {
    if (!token) return;
    linkWitnessAfterRegister(token)
      .catch(() => {})
      .finally(() => navigate(`/vouch/${token}`, { replace: true }));
  }, [token]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<LoadingSpinner fullPage />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/providers/:id" element={<ProviderProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/vouch/:token" element={<WitnessVouch />} />
            <Route path="/jobs" element={<JobListings />} />
            <Route
              path="/jobs/new"
              element={
                <ProtectedRoute roles={['customer']}>
                  <PostJob />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['customer', 'provider', 'admin']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book/:providerId"
              element={
                <ProtectedRoute roles={['customer']}>
                  <BookingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/customer"
              element={
                <ProtectedRoute roles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/provider"
              element={
                <ProtectedRoute roles={['provider']}>
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
