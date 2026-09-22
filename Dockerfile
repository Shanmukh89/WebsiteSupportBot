FROM node:20-slim

# Install Python 3, pip, and system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install Node dependencies
RUN npm install

# Install Python scraping libraries
RUN python3 -m pip install --break-system-packages requests beautifulsoup4 trafilatura playwright

# Install Playwright Chromium browser and system dependencies
RUN npx playwright install --with-deps chromium

# Copy application source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Start the worker
CMD ["npm", "run", "worker"]
