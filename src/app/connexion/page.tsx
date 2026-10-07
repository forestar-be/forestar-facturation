"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  Button,
  Card,
  CardContent,
  FormField,
  Input,
  Spinner,
} from "@forestar-be/ui";

/**
 * En mode SSO, cette page n'affiche plus de formulaire : les identifiants sont
 * saisis chez Zitadel. La route reste valide — d'anciens liens et favoris y
 * mènent — et repart aussitôt vers l'IdP.
 */
function SsoLoginRedirect() {
  const { loginAction, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace("/");
      return;
    }
    if (started.current) return;
    started.current = true;
    void loginAction({ username: "", password: "" }, "/");
  }, [isAuthenticated, isLoading, loginAction, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">
        Redirection vers l&apos;authentification Forestar…
      </p>
    </div>
  );
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { loginAction, isAuthenticated, isLoading, ssoEnabled } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginAction(formData);
      if (!result.success) {
        setError(result.message);
      }
    } catch {
      setError("Une erreur est survenue lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Après les hooks : leur ordre doit rester identique d'un rendu à l'autre.
  if (ssoEnabled) return <SsoLoginRedirect />;

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-card shadow-lg">
          <Image
            src="/logo-70x70.png"
            alt="Forestar Logo"
            width={60}
            height={60}
            className="rounded-full"
          />
        </div>
        <h1 className="mb-2 text-3xl">Forestar Rapprochement</h1>
        <p className="text-muted-foreground">
          Connectez-vous pour accéder au rapprochement bancaire
        </p>

        <Card className="mt-8 text-left">
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive"
                >
                  <AlertCircle className="size-5 shrink-0" />
                  <h3>{error}</h3>
                </div>
              )}

              <FormField label="Nom d'utilisateur">
                {(field) => (
                  <Input
                    {...field}
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Nom d'utilisateur"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                )}
              </FormField>

              <FormField label="Mot de passe">
                {(field) => (
                  <div className="relative">
                    <Input
                      {...field}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="Mot de passe"
                      className="pr-10"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                )}
              </FormField>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Spinner size="sm" className="text-current" />
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
