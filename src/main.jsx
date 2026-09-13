import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import Navbar from './Components/Navbar/Navbar'
import Home from './Home/Home'

import Login from './Components/Login/Login'
import NuevaSolicitud from './Pages/Funcionario/NuevaSolicitud'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/nuevaSolicitud" element={<NuevaSolicitud/>} />
        <Route path="/Iniciar_Sesion" element={<Login />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
