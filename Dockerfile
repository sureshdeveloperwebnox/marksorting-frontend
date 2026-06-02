FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcompat libc6-compat
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ARG BACKEND_API_URL
ENV BACKEND_API_URL=$BACKEND_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache gcompat libc6-compat
RUN npm install -g pnpm
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["pnpm", "run", "start"]
