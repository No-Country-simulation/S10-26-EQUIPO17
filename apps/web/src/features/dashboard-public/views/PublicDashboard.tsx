import { Link } from "react-router-dom";

export function PublicDashboard() {
  return (
    <>
      <nav
        style={{
          padding: "20px",
          background: "#eee",
          display: "flex",
          gap: "15px",
        }}
      >
        <Link to="/">Ir al Dashboard</Link>
        <Link to="/cargar-desafio">Ir a Cargar Desafío</Link>
      </nav>

      <h1>Pieza 1: Dashboard Público (Prueba Social)</h1>
    </>
  );
}
