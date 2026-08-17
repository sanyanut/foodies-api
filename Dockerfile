FROM node:24-alpine

ENV NODE_ENV=development
ENV PORT=3000

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source
COPY . .

# Generate the Prisma client into ./generated
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start"]
