import {
  BrowserCacheLocation,
  IPublicClientApplication,
  InteractionType,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import {
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { environment } from '../../environments/environment';

function loggerCallback(_logLevel: LogLevel, message: string): void {
  if (!environment.production) {
    console.log(message);
  }
}

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.azureClientId,
      authority: `https://login.microsoftonline.com/${environment.azureTenantId}`,
      redirectUri: environment.redirectUri,
      postLogoutRedirectUri: environment.redirectUri,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage,
    },
    system: {
      loggerOptions: {
        loggerCallback,
        // Temporal: Verbose + PII para diagnosticar ClientAuthError: state_mismatch.
        // Volver a LogLevel.Warning / piiLoggingEnabled: false una vez resuelto.
        logLevel: LogLevel.Verbose,
        piiLoggingEnabled: true,
      },
    },
  });
}

// Mapea las rutas del API Gateway al scope que MsalInterceptor debe pedir
// automaticamente antes de adjuntar el bearer token a cada request.
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string> | null>();
  protectedResourceMap.set(`${environment.apiUrl}/*`, [environment.apiScope]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['openid', 'profile'],
    },
  };
}

// Scopes minimos para el login (perfil basico del usuario)
export const loginRequest = {
  scopes: ['openid', 'profile'],
};

// Lee los roles de aplicacion (App Roles de Entra ID) desde los claims del ID token.
export function getRolesFromAccount(account: AccountInfo | null): string[] {
  const claims = account?.idTokenClaims as { roles?: string[] } | undefined;
  return claims?.roles ?? [];
}
