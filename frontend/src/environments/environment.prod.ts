// Configuracion de produccion (ng build --configuration production).
// Reemplaza environment.ts via fileReplacements en angular.json.
export const environment = {
  production: true,
  azureClientId: '00000000-0000-0000-0000-000000000000',
  azureTenantId: '00000000-0000-0000-0000-000000000000',
  redirectUri: 'https://martin-romero.cl/cloud',
  apiScope: 'api://00000000-0000-0000-0000-000000000000/access_as_user',
  apiUrl: 'https://TU-API-ID.execute-api.TU-REGION.amazonaws.com',
};
