# Production image: builds the static Vite bundle, then serves it with nginx
# (also reverse-proxying /api to the backend — see nginx/default.conf.template).

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* vars at build time. VITE_MOCK_AUTH defaults to mock mode
# (see src/api/mock.js) unless explicitly "false" — pin it here so a plain
# `docker build` never ships a fake-data production bundle by accident.
ARG VITE_MOCK_AUTH=false
ENV VITE_MOCK_AUTH=$VITE_MOCK_AUTH
RUN npm run build

FROM nginx:1.27-alpine
# Backend upstream for the /api reverse proxy — override at `docker run -e` /
# compose `environment:` if the service isn't named "api" on the network.
ENV API_UPSTREAM=http://api:8080
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
