# Dockerfile.dev
FROM node:20-alpine

# Set workdir
WORKDIR /app

# Copy only package files first – this lets Docker cache `npm install`
COPY package*.json ./

# Install dependencies (including dev deps like nodemon if you prefer)
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the port your Express app listens on (example: 3000)
EXPOSE 8000

# ---- default command: run the npm “dev” script ----
CMD ["npm", "run", "dev"]
