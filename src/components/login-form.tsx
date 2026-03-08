/**
 * LoginForm — handles email/password authentication against Supabase.
 * Built with TanStack Form for state management and Zod for field-level
 * real-time validation. Displays inline errors as the user types.
 */
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { loginSchema } from "@/schemas/auth.schema";
import { useAuthStore } from "@/store/auth.store";

function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: value.email,
        password: value.password,
      });
      if (error) {
        setAuthError(t("login.error"));
        return;
      }
      if (data.user) {
        setUser(data.user);
        void navigate({ to: "/main" });
      }
    },
  });

  return (
    <Card className="w-full max-w-sm border-2 border-border shadow-[4px_4px_0px_0px] shadow-border/60">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-sm border-2 border-primary bg-primary/10">
          <KeyRound className="size-6 text-primary" />
        </div>
        <CardTitle className="text-xl tracking-wider uppercase">
          {t("login.title")}
        </CardTitle>
        <CardDescription className="tracking-wide">
          {t("login.description")}
        </CardDescription>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <CardContent className="space-y-4">
          {/* Email field */}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value) return undefined;
                const result = loginSchema.shape.email.safeParse(value);
                if (!result.success) return t("login.email.invalid");
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label
                  htmlFor="email"
                  className="tracking-wide uppercase text-xs"
                >
                  {t("login.email.label")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("login.email.placeholder")}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="border-2 pl-9 font-retro"
                    required
                  />
                </div>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Password field */}
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (!value) return undefined;
                const result = loginSchema.shape.password.safeParse(value);
                if (!result.success) return t("login.password.minLength");
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label
                  htmlFor="password"
                  className="tracking-wide uppercase text-xs"
                >
                  {t("login.password.label")}
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("login.password.placeholder")}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="border-2 pl-9 font-retro"
                    required
                  />
                </div>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Supabase auth error */}
          {authError && (
            <p className="text-xs text-destructive text-center">{authError}</p>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3 mt-4">
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full border-2 border-primary tracking-widest uppercase shadow-[2px_2px_0px_0px] shadow-primary/40 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t("login.submitting")}
                  </>
                ) : (
                  t("login.submit")
                )}
              </Button>
            )}
          </form.Subscribe>
          <p className="text-xs text-muted-foreground tracking-wide">
            {t("login.notice")}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export { LoginForm };
