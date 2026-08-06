# Draw Game — Development Plan

A Skribbl-style online multiplayer drawing & guessing game.

## Stack

- **Client**: React (Vite) — dev on `http://localhost:5173`
- **Server**: Node + Express + Socket.io — on `http://localhost:3001`
- **Language**: plain JavaScript (ESM)
- **Monorepo**: root `package.json` runs both via `concurrently`

## Features (v1)

- Join with a nickname
- Create or join a room by 4-letter code
- 2-8 players per room
- Random drawer each round, random word selection
- Drawing canvas (brush, colors, eraser, undo, clear)
- Real-time drawing sync (vector strokes broadcast + replayed for late joiners)
- Chat box with guess checking
- Scoreboard (live + final leaderboard)
- Next round auto-starts; game ends when every player has drawn

## Directory Layout

```
draw-game/
├── package.json
├── DEVELOPMENT_PLAN.md
├── server/
│   ├── package.json
│   └── src/
│       ├── index.js     # Express + Socket.io bootstrap, static serving
│       ├── rooms.js     # room CRUD: create/join/leave, player management
│       ├── game.js      # round state machine, timer, scoring, word reveal
│       ├── words.js     # word bank + pickWord()
│       └── socket.js    # socket event wiring
└── client/
    ├── package.json
    ├── vite.config.js   # proxy /socket.io to :3001
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx              # screen router
        ├── socket.js            # socket.io client wrapper
        └── components/
            ├── Home.jsx
            ├── Lobby.jsx
            ├── Game.jsx
            ├── Canvas.jsx
            ├── Chat.jsx
            ├── Scoreboard.jsx
            └── WordReveal.jsx
```

## Game Rules

- Room default `rounds = playerCount` (everyone draws exactly once, up to 8).
- Each round: random drawer, random word, 80s timer.
- Drawer sees the word; guessers see underscores.
- **Scoring** (tiered by speed):
  - 1st guesser: +100, then decays to +10 by 50% time remaining; drawer gets the same per correct guesser.
- Correct guess reveals the word to that player; they keep chatting but no more points.
- Round ends when all guessed or timer hits 0 → 5s reveal screen → auto next round.
- Final round: leaderboard with "Play Again".

## Guess Checking

Normalize: `lowercase`, `trim`, strip non-alphanumeric. Compare guess to word.
Allow hints: `_` placeholder shown to guessers as underscores per letter.

## Socket Event Contract

| Direction | Event | Payload |
|---|---|---|
| C→S | `createRoom` | `{ name }` |
| C→S | `joinRoom` | `{ code, name }` |
| C→S | `startGame` | — |
| C→S | `drawStroke` | `{ tool, color, size, points[] }` |
| C→S | `undoStroke` | — |
| C→S | `clearCanvas` | — |
| C→S | `message` | `{ text }` (routed through guess filter) |
| C→S | `playAgain` | — |
| C→S | `leaveRoom` | — |
| S→C | `roomState` | full room snapshot (lobby + game) |
| S→C | `error` | `{ message }` |
| S→C | `roundStart` | `{ round, drawer, wordLength, time }` |
| S→C | `timer` | `{ remaining }` |
| S→C | `newStroke` | stroke payload |
| S→C | `strokeUndone` | — |
| S→C | `canvasCleared` | — |
| S→C | `newMessage` | `{ id, name, text, isCorrect }` |
| S→C | `correctGuess` | `{ name, points }` |
| S→C | `roundEnd` | `{ word, scores }` |
| S→C | `gameEnd` | `{ scores }` |

## Build Order

1. Scaffold monorepo + server plumbing + client shell
2. Server: rooms & lobby
3. Server: game state machine (rounds, drawer, word, timer, scoring)
4. Client: Home + Lobby
5. Client: Canvas + real-time sync
6. Client: Chat + guess + scoreboard + game-over
7. Verify end-to-end (two browser windows, full game)

## Verification

- `npm run dev` at root starts server (3001) + client (5173).
- Open two browser windows, join same room, play rounds.
- Edge cases: room full, invalid code, guesser timing, drawer leaving mid-round, late joiner replays strokes.
