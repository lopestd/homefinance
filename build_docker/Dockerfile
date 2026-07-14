FROM node:20-bullseye-slim AS frontend-build
ARG APP_VERSION
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-bullseye
ARG APP_VERSION
WORKDIR /app/backend
ENV NODE_ENV=production
LABEL org.opencontainers.image.title="HomeFinance" \
      org.opencontainers.image.version="${APP_VERSION}"
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
EXPOSE 3000
CMD ["node", "server.js"]
