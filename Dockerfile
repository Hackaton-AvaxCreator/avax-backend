# Use official oven/bun as base image
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json tsconfig.json ./
COPY prisma ./prisma

# Install dependencies
RUN bun pm cache rm --all
RUN bun install

# Copy application files
COPY . .

# Build the application
RUN bun run build

# Generate Prisma client
RUN bun run db:generate

# Expose the port
EXPOSE 3015

# Start command - using bun run start
CMD ["bun", "run", "start"]