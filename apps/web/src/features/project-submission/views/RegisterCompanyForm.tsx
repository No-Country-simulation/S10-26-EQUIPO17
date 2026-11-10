import { useNavigate } from "react-router-dom";
import { track } from "../../../shared/analytics/analytics";
import { useAuth } from "../../auth/useAuth";
import { registerFlow } from "../challengeFlows";
import { ChallengeWizard } from "../components/ChallengeWizard";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { registerCompany } from "../submissionService";

export function RegisterCompanyForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (values: ChallengeFormValues) => {
    await registerCompany(values);
    track("registered_company");
    // El registro no abre sesión: el login deja las cookies que exige POST /projects.
    await signIn(values.email, values.password);
    navigate("/proyecto/nuevo");
  };

  return (
    <ChallengeWizard
      flow={registerFlow}
      heading={
        <>
          Crea tu cuenta y <span className="text-gradient">comienza</span>
        </>
      }
      subtitle="Registra tu empresa en dos pasos; al terminar subirás tu primer proyecto."
      submitLabel="Crear cuenta y continuar"
      submitIcon="arrow_forward"
      onSubmit={handleSubmit}
    />
  );
}
