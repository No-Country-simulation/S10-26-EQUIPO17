import { useNavigate } from "react-router-dom";
import { projectFlow } from "../challengeFlows";
import { ChallengeWizard } from "../components/ChallengeWizard";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { createProject } from "../submissionService";

// Requiere sesión de empresa (la guardia RequireAuth lo garantiza en las rutas).
export function NewProjectForm() {
  const navigate = useNavigate();

  const handleSubmit = async (values: ChallengeFormValues) => {
    const project = await createProject(values);
    navigate("/dashboard", { state: { project } });
  };

  return (
    <ChallengeWizard
      flow={projectFlow}
      heading={
        <>
          Sube tu <span className="text-gradient">proyecto</span>
        </>
      }
      subtitle="Tu cuenta está lista. Cuéntanos qué quieres resolver."
      submitLabel="Publicar proyecto"
      submitIcon="rocket_launch"
      onSubmit={handleSubmit}
    />
  );
}
