import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { PublicLayout } from "../../../shared/layouts/PublicLayout";
import { ApiError } from "../../../shared/api/apiClient";
import { track } from "../../../shared/analytics/analytics";
import { FormField } from "../../project-submission/components/FormField";
import { RequireGuest } from "../RequireGuest";
import { useAuth } from "../useAuth";

const loginSchema = z.object({
  email: z.email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completingSignIn, setCompletingSignIn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async ({ email, password }: LoginValues) => {
    setSubmitError(null);
    setCompletingSignIn(true);
    try {
      await signIn(email, password);
    } catch (error) {
      setCompletingSignIn(false);
      const status = error instanceof ApiError ? String(error.status) : "network";
      track("login_failed", { status });
      setSubmitError(
        error instanceof ApiError && error.status === 401
          ? "Correo o contraseña incorrectos."
          : "No se pudo iniciar sesión. Inténtalo de nuevo.",
      );
      return;
    }
    track("logged_in");
    navigate(redirectTo, { replace: true });
  };

  const content = (
    <PublicLayout>
      <div className="relative overflow-hidden px-6 py-16 lg:px-8">
        <div className="pointer-events-none absolute -top-40 left-1/4 size-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute right-10 top-1/2 size-80 rounded-full bg-secondary/10 blur-[100px]" />

        <div className="relative mx-auto max-w-md space-y-6">
          <header className="space-y-2 text-center">
            <h1 className="text-3xl font-extrabold text-white">
              Inicia <span className="text-gradient">sesión</span>
            </h1>
            <p className="text-neutral-content">Accede a tu panel de empresa.</p>
          </header>

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-2 rounded-box border border-neutral bg-base-200 p-6 shadow-2xl md:p-8"
          >
            <FormField label="Correo electrónico" error={errors.email?.message}>
              <input {...register("email")} type="email" autoComplete="email" className="input w-full" placeholder="nombre@empresa.com" />
            </FormField>

            <FormField label="Contraseña" error={errors.password?.message}>
              <input {...register("password")} type="password" autoComplete="current-password" className="input w-full" placeholder="••••••••" />
            </FormField>

            {submitError && (
              <div role="alert" className="alert alert-error alert-soft">
                <span className="material-symbols-outlined">error</span>
                <span>{submitError}</span>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn mt-2 w-full border-0 bg-brand-gradient text-white">
              {isSubmitting && <span className="loading loading-spinner loading-sm" />}
              Iniciar sesión
            </button>
          </form>

          <p className="text-center text-sm text-neutral-content">
            ¿Aún no tienes cuenta?{" "}
            <Link to="/crear-cuenta" className="font-semibold text-secondary hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );

  return <RequireGuest submitting={completingSignIn}>{content}</RequireGuest>;
}
