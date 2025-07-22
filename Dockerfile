# Dockerfile

# ---- Base ----
FROM node:18-alpine AS base
RUN apk add --no-cache python3 make g++
WORKDIR /usr/src/app
COPY package*.json ./

# ---- Dependencies ----
FROM base AS dependencies
RUN npm install

# ---- Build ----
FROM base AS build
COPY . .
RUN npm install
RUN npm run build

# ---- Release ----
# Final, minimal image
FROM node:18-alpine AS release
WORKDIR /usr/src/app
# Copy production node_modules from the dependencies stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
# Copy compiled code from the build stage
COPY --from=build /usr/src/app/dist ./dist
# Copy static assets
COPY --from=build /usr/src/app/public ./public
# Copy package.json for the start script
COPY --from=build /usr/src/app/package.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]