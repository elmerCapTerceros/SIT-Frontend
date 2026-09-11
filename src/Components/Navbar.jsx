import React from "react";

function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "15px 40px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#2563eb",
        }}
      >
        SIT
      </div>

      <div
        style={{
          display: "flex",
          gap: "30px",
        }}
      >
        <a href="/" style={{ textDecoration: "none", color: "#374151" }}>
          Inicio
        </a>

        <a href="/solicitudes" style={{ textDecoration: "none", color: "#374151" }}>
          Solicitudes
        </a>

        <a href="/reportes" style={{ textDecoration: "none", color: "#374151" }}>
          Reportes
        </a>

        <a href="/tecnicos" style={{ textDecoration: "none", color: "#374151" }}>
          Técnicos
        </a>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#374151",
        }}
      >
        <span>👤</span>
        <span>Usuario</span>
      </div>
    </nav>
  );
}

export default Navbar;