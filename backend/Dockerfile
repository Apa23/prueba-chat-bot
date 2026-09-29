# Multi-stage: compila TypeScript y produce una imagen ligera solo con lo necesario.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci
COPY backend ./backend
COPY tsconfig.json ./
RUN npm run build --workspace backend

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm ci --omit=dev --workspace backend --ignore-scripts && npm cache clean --force
COPY --from=build /app/backend/dist ./backend/dist
# Los datos se montan como volumen de solo lectura desde el compose.
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/main.js"]
