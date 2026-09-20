# Build stage: install deps with bun and produce a static dist/
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# Same-origin /api is proxied by nginx at runtime, so no VITE_API_URL needed.
RUN bun run build

# Runtime stage: serve dist/ over HTTP and proxy /api to the backend.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
