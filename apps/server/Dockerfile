FROM node:26-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY apps/server apps/server
COPY packages/shared packages/shared
RUN npm run build -w @heartline/server
FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=2567
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/packages/shared packages/shared
EXPOSE 2567
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:2567/health || exit 1
CMD ["node","apps/server/dist/index.js"]
