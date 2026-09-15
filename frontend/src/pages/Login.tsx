import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";
import "./Login.css";

export default function Login() {
  const { instance, inProgress } = useMsal();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion.");
    }
  };

  return (
    <div className="login-card">
      <h1>Iniciar sesion</h1>
      <p>Accede con tu cuenta corporativa (Azure Entra ID).</p>
      {error && <p className="login-error">{error}</p>}
      <button onClick={handleLogin} disabled={inProgress !== InteractionStatus.None}>
        {inProgress !== InteractionStatus.None ? "Redirigiendo..." : "Iniciar sesion con Microsoft"}
      </button>
    </div>
  );
}
