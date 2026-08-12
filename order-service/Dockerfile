# Step 1: Build stage
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .
RUN mkdir -p ./prisma ./src/generated

# Automatically generate Prisma Client if prisma folder exists (Zero-config for Mongo/Postgres/Redis!)
RUN if [ -d "./prisma" ]; then pnpm prisma generate; fi

RUN pnpm run build

# Step 2: Runtime stage
FROM node:20-alpine AS runner

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

# Copy compiled production code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

# Safely copy prisma assets if they exist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

CMD ["pnpm", "run", "start:prod"]