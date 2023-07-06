const http = require("http");
const path = require("path");
const fs = require("fs").promises;
const redis = require("redis");
const { createPool } = require("generic-pool");
const { randomUUID } = require("crypto");
const WebSocket = require("ws");
const { WebSocketServer } = WebSocket;

const port = process.env.PORT || 5001;
const host = process.env.HOST || "localhost";
const redisUrl = process.env.REDIS || "";
const ttl = 10; //10 seconds TTL
const updateInterval = 5000;
const server = http.createServer(requestListener);
const wss = new WebSocketServer({ server });
let statusInterval;

//Redis factory used by pool manager
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
  //Sending client id on initial connection
  const id = randomUUID();
  ws.send(JSON.stringify({ id, statusData: true }));
  console.log(`New client connected: ${id}`);

  ws.on("close", () => {
    console.log(`Client ${id} closed the connection`);
  });

  //Heartbeat handler
  ws.on("message", async function handleMessage(data) {
    const client = await pool.acquire();
    const currentTime = Math.floor(new Date().getTime() / 1000);
    await client.set(data, currentTime, { EX: ttl });
    pool.release(client);
  });

  //Broadcasting active users
  statusInterval = setInterval(async () => {
    const client = await pool.acquire();
    const keys = await client.keys("*");

    wss.clients.forEach(function each(client) {
      if (client.isReady) {
        client.send(JSON.stringify({ keys, statusData: true }));
      }
    });
    pool.release(client);
  }, updateInterval);
});

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

server.on("close", () => clearInterval(updateInterval));

async function requestListener(req, res) {
  switch (req.url) {
    case "/": {
      res.writeHead(200, { "Content-Type": "text/html" });
      const htmlContent = await fs.readFile(
        path.join(__dirname, "public", "index.html")
      );
      res.end(htmlContent);
      break;
    }
    case "/client.js":
      res.writeHead(200, { "Content-Type": "application/javascript" });
      const jsContent = await fs.readFile(
        path.join(__dirname, "public", "client.js")
      );
      res.end(jsContent);
      break;
    default:
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Resource not found" }));
  }
}
