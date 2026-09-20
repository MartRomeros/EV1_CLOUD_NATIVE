// Configuracion de desarrollo (ng serve). No contiene secretos: el frontend
// es un cliente publico (SPA) de MSAL, el client id y tenant id no son sensibles.
export const environment = {
  production: false,
  azureClientId: 'ff785992-929f-42bd-ac1a-826b51eb3dff',
  azureTenantId: '577fddc2-ade2-41b2-b4ae-25856d41a689',
  redirectUri: 'http://localhost:4200',
  apiScope: 'api://00000000-0000-0000-0000-000000000000/access_as_user',
  apiUrl: 'https://TU-API-ID.execute-api.TU-REGION.amazonaws.com',
};
