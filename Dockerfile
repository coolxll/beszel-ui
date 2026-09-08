# syntax=docker/dockerfile:1

FROM node:24-alpine AS builder
WORKDIR /app

# Build-time configuration. Anything VITE_* ends up in the JS bundle.
ARG VITE_BESZEL_URL=http://100.85.194.78:8090
ARG VITE_PB_EMAIL=
ARG VITE_PB_PASSWORD=
ARG VITE_SYSTEM_FLAGS=
ARG VITE_NO_AUTH=

ENV VITE_BESZEL_URL=$VITE_BESZEL_URL \
    VITE_PB_EMAIL=$VITE_PB_EMAIL \
    VITE_PB_PASSWORD=$VITE_PB_PASSWORD \
    VITE_SYSTEM_FLAGS=$VITE_SYSTEM_FLAGS \
    VITE_NO_AUTH=$VITE_NO_AUTH

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile=false

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
