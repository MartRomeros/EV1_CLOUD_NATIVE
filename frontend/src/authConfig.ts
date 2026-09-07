import type { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI,
    postLogoutRedirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

// Scope expuesto por el API Gateway HTTP (definido al exponer la API en el App Registration)
export const apiRequest = {
  scopes: [import.meta.env.VITE_API_SCOPE],
};

// Scopes minimos para el login (perfil basico del usuario)
export const loginRequest = {
  scopes: ["openid", "profile"],
};
