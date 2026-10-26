import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Defines las reglas de validación en segundos
const challengeSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'Describe mejor tu desafío (mínimo 20 caracteres)'),
  companyName: z.string().min(2, 'El nombre de la empresa es obligatorio'),
});

// Crear el tipo TypeScript automáticamente basado en las reglas anteriores
type ChallengeFormData = z.infer<typeof challengeSchema>;

export function NewChallengeForm() {
  // 2. Conectas las herramientas
  const { register, handleSubmit, formState: { errors } } = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
  });

  const onSubmit = (data: ChallengeFormData) => {
    console.log("Datos listos y validados para enviar a la API:", data);
    // Aquí llamarías a tu submissionService
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="card w-full max-w-lg bg-base-100 shadow-xl mx-auto my-10 p-8"
    >
      <h2 className="card-title text-2xl font-bold mb-5 justify-center">
        Cargar Nuevo Desafío
      </h2>
      <div>
        <div className="space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold">
                Nombre de la Empresa
              </span>
            </label>
            <input
              {...register("companyName")}
              type="text"
              className="input input-bordered w-full"
              placeholder="Ej. NoCountry"
            />
            {errors.companyName && (
              <p style={{ color: "red" }}>{errors.companyName.message}</p>
            )}
          </div>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold">
                Título del Desafío
              </span>
            </label>
            <input
              {...register("title")}
              type="text"
              className="input input-bordered w-full"
              placeholder="Ej. Nuevo Desafío"
            />
            {errors.title && (
              <p style={{ color: "red" }}>{errors.title.message}</p>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold">
                Descripción del Problema
              </span>
            </label>
            <textarea
              {...register("description")}
              className="textarea textarea-bordered h-24"
              placeholder="Escribe aquí..."
            ></textarea>
            {errors.description && (
              <p style={{ color: "red" }}>{errors.description.message}</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4">
            Enviar Desafío
          </button>
        </div>
      </div>
    </form>
  );
}
