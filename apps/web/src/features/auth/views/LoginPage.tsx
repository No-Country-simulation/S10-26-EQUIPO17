import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PublicLayout } from "../../../shared/layouts/PublicLayout";
import { ApiError } from "../../../shared/api/apiClient";
import { track } from "../../../shared/analytics/analytics";
import { FormField } from "../../project-submission/components/FormField";
import { RequireGuest } from "../RequireGuest";
import { loginSchema, type LoginValues } from "../loginSchema";
import { useAuth } from "../useAuth";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completingSignIn, setCompletingSignIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields, touchedFields, isSubmitting, isValid },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const email = useWatch({ control, name: "email" });
  const password = useWatch({ control, name: "password" });
  const emailInteracted = Boolean(dirtyFields.email || touchedFields.email || errors.email);
  const passwordInteracted = Boolean(dirtyFields.password || touchedFields.password || errors.password);
  const formInteracted = emailInteracted || passwordInteracted;
  const emailValidation = loginSchema.shape.email.safeParse(email);
  const passwordValidation = loginSchema.shape.password.safeParse(password);
  const emailState = emailInteracted ? (emailValidation.success ? "success" : "error") : null;
  const passwordState = passwordInteracted ? (passwordValidation.success ? "success" : "error") : null;
  const emailError = emailState === "error" && !emailValidation.success ? emailValidation.error.issues[0]?.message : undefined;
  const passwordError = passwordState === "error" && !passwordValidation.success ? passwordValidation.error.issues[0]?.message : undefined;
  const fieldsetClass = (state: "error" | "success" | null) =>
    `rounded-box border p-3 ${state === "error" ? "border-error" : state === "success" ? "border-success" : "border-transparent"}`;

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
            className={`login-validation space-y-2 rounded-box border bg-base-200 p-6 shadow-2xl md:p-8 ${formInteracted ? (isValid ? "border-success" : "border-error") : "border-neutral"}`}
          >
            <FormField label="Correo electrónico" error={emailError} errorId="login-email-error" className={fieldsetClass(emailState)}>
              <input {...register("email")} type="email" autoComplete="email" required aria-label="Correo electrónico" aria-invalid={emailState === "error"} aria-describedby={emailError ? "login-email-error" : undefined} className={`input validator w-full ${emailState === "error" ? "input-error" : emailState === "success" ? "input-success" : ""}`} placeholder="nombre@empresa.com" />
            </FormField>

            <FormField label="Contraseña" error={passwordError} errorId="login-password-error" hint="Mínimo 8 caracteres." className={fieldsetClass(passwordState)}>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  aria-label="Contraseña"
                  aria-invalid={passwordState === "error"}
                  aria-describedby={passwordError ? "login-password-error" : undefined}
                  className={`input validator w-full pr-12 ${passwordState === "error" ? "input-error" : passwordState === "success" ? "input-success" : ""}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="btn btn-ghost btn-sm btn-square absolute right-1 top-1/2 -translate-y-1/2 text-neutral-content"
                >
                  <span aria-hidden="true" className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </FormField>

            {submitError && (
              <div role="alert" className="alert alert-error alert-soft">
                <span className="material-symbols-outlined">error</span>
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="btn mt-2 w-full border-0 bg-brand-gradient text-white disabled:bg-none disabled:bg-base-300 disabled:text-neutral-content"
            >
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
