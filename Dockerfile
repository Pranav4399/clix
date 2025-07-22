# Dockerfile

# ---- Base ----
FROM node:18-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# ---- Dependencies ----
FROM base AS dependencies
RUN npm install --production

# ---- Build ----
FROM base AS build
COPY . .
RUN npm install
RUN npm run build

# ---- Release ----
FROM node:18-alpine AS release
WORKDIR /usr/src/app
COPY --from=dependencies /usr/src//app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]
