# ========================================================
# Stage 1: Compilación de la aplicación Angular 22
# ========================================================
FROM node:22-alpine AS build

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar en modo producción (baseHref "/" configurado en angular.json)
RUN npm run build:prod

# ========================================================
# Stage 2: Servidor Nginx ligero para estáticos
# ========================================================
FROM nginx:alpine

# Copiar configuración optimizada para SPA de Angular
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos compilados desde el build stage
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Exponer el puerto 80 interno del contenedor
EXPOSE 80

# Ejecutar Nginx en modo foreground
CMD ["nginx", "-g", "daemon off;"]
