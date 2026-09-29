FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY docker-entrypoint.sh /usr/local/bin/front-entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/front-entrypoint && chmod +x /usr/local/bin/front-entrypoint

EXPOSE 5173
ENTRYPOINT ["front-entrypoint"]
