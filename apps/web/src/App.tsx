// apps/web/src/App.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthProvider";
import { RequireAuth } from "./features/auth/RequireAuth";
import { LoginPage } from "./features/auth/views/LoginPage";
import { Dashboard } from "./features/auth/views/Dashboard";
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
    element: <NewChallengeForm />, // Pieza 2: Formulario inicial (invitado)
  },
  {
    path: "/crear-cuenta",
    element: <RegisterCompanyForm />,
  },
  {
    path: "/iniciar-sesion",
    element: <LoginPage />,
  },
  {
    path: "/proyecto/nuevo",
    element: (
      <RequireAuth>
        <NewProjectForm />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/tracking/:id",
    element: <ProjectTracking />, // Pieza 3 y 6: Ver estado y progreso
  },
]);

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
