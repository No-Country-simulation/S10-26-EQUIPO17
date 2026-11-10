import { guestFlow } from "../challengeFlows";
import { ChallengeWizard } from "../components/ChallengeWizard";

// Flujo de invitado: no requiere cuenta, por eso termina en el paso del proyecto.
export function NewChallengeForm() {
  const handleSubmit = async (values: unknown) => {
    // TODO: el invitado aún no tiene endpoint en la API; POST /projects exige sesión de empresa.
    console.log("Datos del invitado listos y validados:", values);
  };

  return (
    <ChallengeWizard
      flow={guestFlow}
      heading={
        <>
          Configura tu <span className="text-gradient">desafío de innovación</span>
        </>
      }
      subtitle="Tres pasos para que los equipos empiecen a trabajar en tu proyecto, sin crear una cuenta."
      submitLabel="Publicar desafío"
      submitIcon="rocket_launch"
      successMessage="¡Desafío enviado! Gracias por compartir tu proyecto."
      onSubmit={handleSubmit}
    />
  );
}
