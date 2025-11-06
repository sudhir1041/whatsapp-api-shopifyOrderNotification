FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code (excluding node_modules and build)
COPY app ./app/
COPY public ./public/
COPY *.js *.json *.md *.toml ./
COPY .env* ./

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "docker-start"]