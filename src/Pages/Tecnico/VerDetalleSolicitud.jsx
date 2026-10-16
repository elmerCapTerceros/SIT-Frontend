import React from 'react';
import './VerDetalleSolicitud.css';
import { FaClipboardList } from 'react-icons/fa';

const VerDetalleSolicitud = () => {
  return (
    <div className="at-page report-page">
			<header className="at-header">
				<span className="at-header-icon" aria-hidden="true"><FaClipboardList /></span>
				<div>
					<h1>Detalle de la solicitud</h1>
					<p>Detalle de la solicitudes tecnicas</p>
				</div>
			</header>

     <div className='informacion-detalle'>
        <h3>Nombre: </h3>
        <h3>Apellido: </h3>
        <h3>Cargo: </h3>
         <h3>Area: </h3>
        <h3>Ubicación: </h3>

        
    </div>
    </div>
  );
};

export default VerDetalleSolicitud;
