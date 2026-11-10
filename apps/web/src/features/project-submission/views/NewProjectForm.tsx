import { projectFlow } from "../challengeFlows";
import { ChallengeWizard } from "../components/ChallengeWizard";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { createProject } from "../submissionService";

// Requiere la sesión que deja el registro/login (cookie access_token).
export function NewProjectForm() {
  const handleSubmit = async (values: ChallengeFormValues) => {
    await createProject(values);
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
      successMessage="¡Proyecto publicado! Los equipos ya pueden verlo."
      onSubmit={handleSubmit}
    />
  );
}
