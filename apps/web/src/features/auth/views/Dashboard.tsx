import { AdminDashboard } from "../../dashboard-admin/views/AdminDashboard";
import { CompanyDashboard } from "../../dashboard-company/views/CompanyDashboard";
import { useAuth } from "../useAuth";

export function Dashboard() {
  const { user } = useAuth();
  return user?.role === "admin" ? <AdminDashboard /> : <CompanyDashboard />;
}
