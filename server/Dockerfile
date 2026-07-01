FROM node:22-slim
# build tools por si better-sqlite3/sharp no tienen prebuild para la arch del VPS
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV DOMI_DATA_DIR=/data
EXPOSE 8080
CMD ["node", "server.mjs"]
