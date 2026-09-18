import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Login from './Components/Login/Login';
import Home from './Home/Home';
import NuevaSolicitud from './Pages/Funcionario/nuevaSolicitud';
import MisSolicitudes from './Pages/Funcionario/MisSolicitudes';
import RegistroDeUsuario from './Pages/RegistroDeUsuario/RegistroDeUsuario';
import NotFound from './Pages/NotFound/NotFound';

const ProtectedRoute = ({ children }) => (
  localStorage.getItem('token') ? children : <Navigate to="/login" replace />
);

const PrivateLayout = ({ children }) => <><Navbar />{children}</>;
const defaultRoute = localStorage.getItem('primerIngreso') === 'true' ? '/login' : '/home';

const RoutesApp = () => (
  <Routes>
    <Route path="/" element={<Navigate to={localStorage.getItem('token') ? defaultRoute : '/login'} replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/registro-usuario" element={<ProtectedRoute><RegistroDeUsuario /></ProtectedRoute>} />
    <Route path="/Iniciar_Sesion" element={<Navigate to="/login" replace />} />
    <Route path="/home" element={<ProtectedRoute><PrivateLayout><Home /></PrivateLayout></ProtectedRoute>} />
    <Route path="/nueva-solicitud" element={<ProtectedRoute><PrivateLayout><NuevaSolicitud /></PrivateLayout></ProtectedRoute>} />
    <Route path="/mis-solicitudes" element={<ProtectedRoute><PrivateLayout><MisSolicitudes /></PrivateLayout></ProtectedRoute>} />
    <Route path="/nuevaSolicitud" element={<Navigate to="/nueva-solicitud" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default RoutesApp;
