const { WebSocket } = require("ws");
const serverUrl = process.env.URL || "ws://localhost:5001";

const ws = new WebSocket(serverUrl);
let interval;
let clientId;

ws.on("error", function hendleError() {
  console.error(error);
  clearInterval(interval);
});

ws.on("close", function handleClose() {
  console.log("Connection closed!");
  clearInterval(interval);
});

ws.on("open", function open() {
  console.log("Connection established!");

  const HEARTBEAT_INTERVAL = 2000;
  interval = setInterval(function sendHeartBeat() {
    ws.send(clientId);
  }, HEARTBEAT_INTERVAL);
});

ws.on("message", function message(data) {
  const { id } = JSON.parse(data);
  clientId = id;
  console.log(`Assigned client ID: ${id}`);
});
