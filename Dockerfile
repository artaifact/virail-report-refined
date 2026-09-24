# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps --no-audit --no-fund

# Copy application source
COPY . .

# Build Vite SPA with production env
ARG VITE_API_BASE_URL=https://api.viraill.com
ENV VITE_API_BASE_URL=https://api.viraill.com \
    VITE_AUTH_MODE=cookies \
    NODE_ENV=production

RUN npm run build

# Production serve stage with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built dist files
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
