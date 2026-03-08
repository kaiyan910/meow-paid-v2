/**
 * LoginPage — full-screen centered layout wrapping the login form.
 */
import { useTranslation } from "react-i18next";

import { LoginForm } from "@/components/login-form";

function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-[0.3em] uppercase text-primary">
            {t("app.title")}
          </h1>
          <div className="mx-auto mt-2 h-0.5 w-24 bg-primary/40" />
        </header>
        <LoginForm />
        <footer className="text-center text-xs tracking-wider text-muted-foreground">
          {t("app.footer")}
        </footer>
      </div>
    </div>
  );
}

export { LoginPage };
