# ---- Build Stage ----
FROM node:20-alpine as builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# ---- Runtime Stage ----
FROM node:20-alpine as runner
WORKDIR /app
# Create non-root user
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
COPY --from=builder /app .
EXPOSE 3000
ENV NODE_ENV=production
USER appuser
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:3000 || exit 1
CMD ["npm", "start"] 