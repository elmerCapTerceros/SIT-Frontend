import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Login from './Components/Login/Login';
import Home from './Home/Home';
import NuevaSolicitud from './Pages/Funcionario/nuevaSolicitud';
import MisSolicitudes from './Pages/Funcionario/MisSolicitudes';
import NotFound from './Pages/NotFound/NotFound';

const ProtectedRoute = ({ children }) => (
  localStorage.getItem('token') ? children : <Navigate to="/login" replace />
);

const PrivateLayout = ({ children }) => <><Navbar />{children}</>;

const RoutesApp = () => (
  <Routes>
    <Route path="/" element={<Navigate to={localStorage.getItem('token') ? '/home' : '/login'} replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/Iniciar_Sesion" element={<Navigate to="/login" replace />} />
    <Route path="/home" element={<ProtectedRoute><PrivateLayout><Home /></PrivateLayout></ProtectedRoute>} />
    <Route path="/nueva-solicitud" element={<ProtectedRoute><PrivateLayout><NuevaSolicitud /></PrivateLayout></ProtectedRoute>} />
    <Route path="/mis-solicitudes" element={<ProtectedRoute><PrivateLayout><MisSolicitudes /></PrivateLayout></ProtectedRoute>} />
    <Route path="/nuevaSolicitud" element={<Navigate to="/nueva-solicitud" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default RoutesApp;
