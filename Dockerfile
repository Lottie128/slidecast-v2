# ============================================
# SlideCast V2 - Production Dockerfile
# ============================================

FROM oven/bun:1 AS base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python TTS package
RUN pip3 install edge-tts --break-system-packages

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create storage directories
RUN mkdir -p storage/audio storage/video storage/images

# Build client (if needed)
RUN bun run build:client || echo "No client build needed"

# Expose port
EXPOSE 5173

# Set environment
ENV NODE_ENV=production
ENV PORT=5173

# Start server
CMD ["bun", "run", "start"]
