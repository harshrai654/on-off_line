const http = require("http");
const redis = require("redis");
const { createPool } = require("generic-pool");
const { randomUUID } = require("crypto");
const { WebSocketServer } = require("ws");

const port = process.env.PORT || 5001;
const host = process.env.HOST || "localhost";
const redisUrl = process.env.REDIS || "";
const ttl = 10; //10 seconds TTL
const server = http.createServer();
const wss = new WebSocketServer({ server });

const redisFactory = {
  create: async () => {
    const client = redis.createClient();
    await client.connect();
    return client;
  },
  destroy: async (client) => await client.disconnect(),
};

const pool = createPool(redisFactory, {
  max: 10,
  min: 3,
  acquireTimeoutMillis: 5000,
  destroyTimeoutMillis: 4000,
});

wss.on("connection", function handleInitialConnection(ws, request) {
  const id = randomUUID();
  ws.send(JSON.stringify({ id }));
  console.log(`New client connected: ${id}`);

  ws.on("close", () => {
    console.log(`Client ${id} closed the connection`);
  });

  ws.on("message", async function handleMessage(data) {
    const client = await pool.acquire();
    const currentTime = Math.floor(new Date().getTime() / 1000);
    await client.set(data, currentTime, { EX: ttl });
    pool.release(client);
  });
});

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

server.on("listening", function initializeServer() {});
