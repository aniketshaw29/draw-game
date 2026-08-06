# Architecture Overview

High-level design of the Draw Game — a Skribbl-style online multiplayer drawing and guessing game.

## System Diagram

```
┌───────────────────────────┐            ┌───────────────────────────┐
│  Browser A (Player 1)     │            │  Browser B (Player 2)     │
│  React SPA (Vite)         │            │  React SPA (Vite)         │
└────────────┬──────────────┘            └────────────┬──────────────┘
             │  Socket.io (WebSocket)                 │
             └──────────────┬─────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Node Server   │  ← single source of truth
                    │  Express       │     for all game state
                    │  Socket.io     │
                    └───────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │ rooms   │   │  game   │   │ words   │
        │  module │   │  module │   │  module │
        └─────────┘   └─────────┘   └─────────┘
```

## Core Principle

**The server is the source of truth.** All authoritative game state (players, rounds,
drawer, word, timer, scores, strokes) lives in memory on the server. The client is a
thin, dumb view that renders whatever `roomState` the server pushes and emits intents
(`startGame`, `message`, `drawStroke`). This makes cheating hard, keeps clients
synchronized, and simplifies reconnecting.

## Module Responsibilities

| Module | Location | Responsibility |
|---|---|---|
| `index.js` | `server/src/` | Boot Express + Socket.io, serve built client in prod |
| `rooms.js` | `server/src/` | Room CRUD, player join/leave, host management |
| `game.js` | `server/src/` | Round state machine, timer, scoring, auto-advance |
| `words.js` | `server/src/` | Word bank, `pickWord()`, placeholder generation |
| `socket.js` | `server/src/` | Wire socket events to rooms/game modules |
| `App.jsx` | `client/src/` | Screen router: Home → Lobby → Game → GameOver |
| `socket.js` | `client/src/` | Thin socket.io wrapper + emit helpers |
| `Canvas.jsx` | `client/src/` | Drawing surface, stroke capture/playback |
| `Chat.jsx` | `client/src/` | Guess input + message feed |
| `Scoreboard.jsx` | `client/src/` | Live scores + final leaderboard |

## Data Flow

### Drawing a stroke (example)

1. `Canvas.jsx` captures pointer events → builds `{tool, color, size, points[]}`.
2. Emits `drawStroke` over the socket.
3. Server validates the sender is the current drawer, appends stroke to room history,
   and broadcasts `newStroke` to everyone in the room.
4. Each client replays the stroke onto its own canvas. Late joiners receive the
   full `strokes[]` history in `roomState` and replay everything.

### Guessing (example)

1. `Chat.jsx` emits `message { text }`.
2. Server runs `guess filter` → compares against the round word.
3. If correct → awards points, emits `correctGuess` + `newMessage(isCorrect:true)`.
4. If wrong → just `newMessage`, chat feed shows it normally.

## Communication: why Socket.io over REST

- Real-time bidirectional messages (drawing) need a persistent WebSocket.
- Rooms give us broadcast semantics out of the box (`io.to(code).emit(...)`).
- Automatic reconnect + buffering keeps flaky clients usable.
- REST (via Express) is only used to serve the static client bundle in prod.

## Key Non-Goals (v1)

- No database — state is in-memory and lost on server restart.
- No auth — nicknames are self-chosen.
- No canvas image export/upload.

## Related Docs

- [Server Architecture](SERVER_ARCHITECTURE.md)
- [Client Architecture](CLIENT_ARCHITECTURE.md)
- [Game State Machine](GAME_STATE_MACHINE.md)
- [Socket Protocol](SOCKET_PROTOCOL.md)
- [Canvas & Real-time Sync](CANVAS_AND_REALTIME.md)
