FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Nur Produktions-Dependencies
RUN npm install --omit=dev

COPY . .

EXPOSE 8000

# Direkt mit node starten, kein nodemon
CMD ["node", "src/app.js"]
