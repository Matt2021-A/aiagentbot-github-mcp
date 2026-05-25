FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev \
  && npm cache clean --force

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY index.js ./
COPY src ./src

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "start"]
