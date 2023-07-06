const serverUrl = "ws://localhost:5001";

const ws = new WebSocket(serverUrl);
let interval;
let clientId;

ws.addEventListener("error", function hendleError() {
  console.error(error);
  clearInterval(interval);
});

ws.addEventListener("close", function handleClose() {
  console.log("Connection closed!");
  clearInterval(interval);
});

ws.addEventListener("open", function open() {
  console.log("Connection established!");

  const HEARTBEAT_INTERVAL = 2000;
  interval = setInterval(function sendHeartBeat() {
    ws.send(clientId);
  }, HEARTBEAT_INTERVAL);
});

ws.addEventListener("message", function message({ data }) {
  const parsedData = JSON.parse(data);
  if (parsedData.statusData) {
    const activeList = document.getElementById("actives");

    console.log(parsedData.keys);
  } else {
    const { id } = parsedData;
    clientId = id;
    console.log(`Assigned client ID: ${id}`);
  }
});
