# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG API_URL=https://squadcalc.app/api
ARG SEARCH_ENGINES=false
ARG SMO_WEBSOCKET=false
ARG DISABLE_FACTIONS=false

RUN printf "API_URL=%s\nSEARCH_ENGINES=%s\nSMO_WEBSOCKET=%s\nDISABLE_FACTIONS=%s\n" \
    "$API_URL" "$SEARCH_ENGINES" "$SMO_WEBSOCKET" "$DISABLE_FACTIONS" > .env

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
