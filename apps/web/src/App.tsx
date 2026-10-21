// apps/web/src/App.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PublicDashboard } from "./features/dashboard-public/views/PublicDashboard";
import { NewChallengeForm } from "./features/project-submission/views/NewChallengeForm";
import { ProjectTracking } from "./features/tracking/views/ProjectTracking";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicDashboard />, // Pieza 1: Dashboard público
  },
  {
    path: "/cargar-desafio",
    element: <NewChallengeForm />, // Pieza 2: Formulario inicial
  },
  {
    path: "/tracking/:id",
    element: <ProjectTracking />, // Pieza 3 y 6: Ver estado y progreso
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
