import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => (
  <main className="not-found-page">
    <section className="not-found-card">
      <p>ERROR 404</p>
      <h1>Página no encontrada</h1>
      <span>La dirección que busca no existe o fue movida.</span>
      <Link to={localStorage.getItem('token') ? '/home' : '/login'}>Volver al inicio</Link>
    </section>
  </main>
);

export default NotFound;
