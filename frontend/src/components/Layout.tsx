import type { ReactNode } from "react";
import { useMsal, AuthenticatedTemplate } from "@azure/msal-react";
import "./Layout.css";

export default function Layout({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <span className="layout-title">EV1 Cloud Native</span>
        <AuthenticatedTemplate>
          <div className="layout-user">
            <span>{account?.username}</span>
            <button onClick={handleLogout}>Cerrar sesion</button>
          </div>
        </AuthenticatedTemplate>
      </header>
      <main className="layout-content">{children}</main>
    </div>
  );
}
