FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
COPY public ./public
ENV PORT=8787
ENV DATABASE_PATH=/data/webhooks.db
VOLUME ["/data"]
EXPOSE 8787
CMD ["npm", "start"]
