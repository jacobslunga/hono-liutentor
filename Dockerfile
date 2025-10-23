FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy application code
COPY . .

# Expose port
EXPOSE 4330

# Start the application
CMD ["bun", "run", "index.ts"]
