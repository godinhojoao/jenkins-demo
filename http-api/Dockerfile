# ---- deps + source (shared base) ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# ---- test stage: the build fails here if any test fails ----
FROM base AS test
RUN npm test

# ---- runtime: small image with prod deps only ----
FROM node:20-alpine AS runtime
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY app.js ./
EXPOSE 3000
CMD ["node", "app.js"]
