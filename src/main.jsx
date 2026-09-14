import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import RoutesApp from './RoutesApp';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <RoutesApp />
    </BrowserRouter>
  </StrictMode>,
);
