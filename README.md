# Draw Game

A Skribbl-style online multiplayer drawing & guessing game — React client, Node +
Express + Socket.io server.

## Quick start

```bash
npm run dev        # server :3001 + client :5173
```

Open `http://localhost:5173` in two browser windows, join the same room, play.

## Features

- Join with a nickname; create or join a 4-letter room code
- 2–8 players per room
- Random drawer + random word each round
- Real-time drawing canvas (brush, colors, eraser, undo, clear)
- Chat with guess checking and tiered scoring
- Live scoreboard, auto-advancing rounds, final leaderboard + play again

## Documentation

- [Development Plan](DEVELOPMENT_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Server Architecture](docs/SERVER_ARCHITECTURE.md)
- [Client Architecture](docs/CLIENT_ARCHITECTURE.md)
- [Game State Machine](docs/GAME_STATE_MACHINE.md)
- [Socket Protocol](docs/SOCKET_PROTOCOL.md)
- [Canvas & Real-time Sync](docs/CANVAS_AND_REALTIME.md)
- [Scoring](docs/SCORING.md)
- [Guess Checking](docs/GUESS_CHECKING.md)
- [Room Management](docs/ROOM_MANAGEMENT.md)
- [Deployment](docs/DEPLOYMENT.md)

## Stack

| Layer | Tech |
|---|---|
| Client | React, Vite, socket.io-client |
| Server | Node, Express, Socket.io |
| Language | JavaScript (ESM) |
