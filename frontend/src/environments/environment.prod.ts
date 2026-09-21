// Configuracion de produccion (ng build --configuration production).
// Reemplaza environment.ts via fileReplacements en angular.json.
export const environment = {
  production: true,
  azureClientId: '952083c2-4584-4dec-a3d3-5b0077da3e8f',
  azureTenantId: '639a8b7f-479a-4d37-9418-bad57badccb1',
  redirectUri: 'https://app.martin-romero.cl',
  apiScope: 'api://952083c2-4584-4dec-a3d3-5b0077da3e8f/access_as_user',
  apiUrl: 'https://xa65vrcr55.execute-api.us-east-1.amazonaws.com', // o URL de EC2 backend / API Gateway
};
