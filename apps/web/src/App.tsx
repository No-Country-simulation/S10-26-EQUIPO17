// apps/web/src/App.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PublicDashboard } from "./features/dashboard-public/views/PublicDashboard";
import { NewChallengeForm } from "./features/project-submission/views/NewChallengeForm";
import { NewProjectForm } from "./features/project-submission/views/NewProjectForm";
import { RegisterCompanyForm } from "./features/project-submission/views/RegisterCompanyForm";
import { UploadChallengePage } from "./features/project-submission/views/UploadChallengePage";
import { ProjectTracking } from "./features/tracking-project/views/ProjectTracking";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicDashboard />, // Pieza 1: Dashboard público
  },
  {
    path: "/subir-proyecto",
    element: <UploadChallengePage />,
  },
  {
    path: "/cargar-desafio",
    element: <NewChallengeForm />, // Pieza 2: Formulario inicial
  },
  {
    path: "/crear-cuenta",
    element: <RegisterCompanyForm />,
  },
  {
    path: "/proyecto/nuevo",
    element: <NewProjectForm />,
  },
  {
    path: "/tracking/:id",
    element: <ProjectTracking />, // Pieza 3 y 6: Ver estado y progreso
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
