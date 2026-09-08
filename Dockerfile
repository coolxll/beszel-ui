# syntax=docker/dockerfile:1

FROM node:24-alpine AS builder
WORKDIR /app

ARG VITE_BESZEL_URL=http://100.85.194.78:8090
ENV VITE_BESZEL_URL=$VITE_BESZEL_URL

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile=false

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
