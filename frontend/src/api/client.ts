import axios from "axios";
import type { IPublicClientApplication } from "@azure/msal-browser";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { apiRequest } from "../authConfig";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Obtiene el bearer token (silencioso, con fallback a popup) y lo adjunta a cada request.
export function attachAuthInterceptor(msalInstance: IPublicClientApplication) {
  apiClient.interceptors.request.use(async (config) => {
    const account = msalInstance.getActiveAccount();
    if (!account) {
      throw new Error("No hay una cuenta activa. Inicia sesion primero.");
    }

    try {
      const result = await msalInstance.acquireTokenSilent({
        ...apiRequest,
        account,
      });
      config.headers.Authorization = `Bearer ${result.accessToken}`;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const result = await msalInstance.acquireTokenPopup(apiRequest);
        config.headers.Authorization = `Bearer ${result.accessToken}`;
      } else {
        throw error;
      }
    }

    return config;
  });
}
