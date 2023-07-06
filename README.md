# Online-Offline Tracker

This repository conatins the code to demonstrate archutecture for showing online and offline status of client sessions. The code uses Redis as the database to store TTL epoch timestamps fo various clients. Clients sends heartbeat at regualr interval with an established websocket connection between client and server.
Connection pooling is used to limit number of connection to redis by various clients.
