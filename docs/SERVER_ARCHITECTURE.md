# Server Architecture

Details of the Node + Express + Socket.io server in `server/`.

## Layout

```
server/
├── package.json          # ESM, deps: express, socket.io
└── src/
    ├── index.js          # bootstrap: http server, io, static serving
    ├── rooms.js          # room registry + player management
    ├── game.js           # round machine, timer, scoring
    ├── words.js          # word bank + helpers
    └── socket.js         # per-connection event wiring
```

## Bootstrap (`index.js`)

1. Create an Express app.
2. Create an HTTP server from it.
3. Attach Socket.io: `new Server(httpServer)`.
4. In dev, the Vite dev server proxies `/socket.io` to this port (3001).
5. In prod, serve `client/dist` statically and fall back to `index.html`.
6. `io.on('connection', socket => setupSocket(socket, io))`.

## Room Registry (`rooms.js`)

In-memory store keyed by a 4-letter room code.

```js
const rooms = new Map(); // code -> Room

Room = {
  code,               // "ABCD"
  players: Map(),     // socketId -> { id, name, score, isDrawer, hasGuessed }
  hostId,             // first joiner; can start the game
  state,              // 'lobby' | 'playing' | 'gameover'
  game,               // game state (see game.js) or null
  strokes: [],        // persistent stroke history for late joiners
}
```

### Player lifecycle

| Action | Behavior |
|---|---|
| Create room | Host generates a unique 4-letter code, joins as host |
| Join room | Adds player, rejects if full (max 8) or code unknown |
| Leave / disconnect | Removes player; if host, promote next; if drawer left mid-round, abort round |
| Reconnect | (v1) treated as leave; state is lost |

Validation rules:
- Room code must exist; case-insensitive (`abcD` → `ABCD`).
- Nicknames must be 1–16 chars, trimmed, unique within the room (append suffix if dup).
- Room player cap is 8, minimum to start is 2.

## Game Engine (`game.js`)

Pure-ish module: `startGame(room)`, `startRound(room)`, `handleGuess(room, player, text)`,
`endRound(room)`, `endGame(room)`. See [Game State Machine](GAME_STATE_MACHINE.md) for
the full state flow.

Key internals:

- **Timer**: a `setInterval` per active round that emits `timer` every second and
  triggers `endRound` at 0. Always cleared on round end to avoid leaks.
- **Drawer rotation**: a queue built from the players present at game start. Round
  `n` uses `players[n % players.length]`, so everyone draws exactly once when
  `rounds === players.length`.
- **Word pick**: `words.pickWord()` returns a random word; the same word is never
  reused within one game (track a used-set).
- **Scoring**: implemented in `scoring.js` logic (see [Scoring](SCORING.md)).

## Words (`words.js`)

- A hard-coded array of ~100+ common, drawable nouns.
- `pickWord(used)` → random word not in the used set.
- `mask(word)` → `"____ ____"` placeholder preserving spaces and letter count.

## Socket Wiring (`socket.js`)

Every event handler:

1. Resolves the room from the socket (`socket.data.roomCode`).
2. Validates the action against room + game state.
3. Mutates server state.
4. Emits to the room / players as needed.

Errors are normalized into a single `error { message }` event so the client renders
them uniformly.

### Validation matrix (examples)

| Action | Allowed when |
|---|---|
| `startGame` | sender is host, room has 2–8 players, state is `lobby` |
| `drawStroke` | sender is current drawer, state is `playing` |
| `undoStroke` / `clearCanvas` | sender is current drawer |
| `message` | state is `playing`; drawer's guesses are ignored for points |

## Concurrency & Safety

- All handlers are synchronous in the event loop → no locking needed.
- Every `setInterval` is stored on the room and cleared on round end / room delete.
- Rooms are deleted (and sockets ejected) when empty.

## Related Docs

- [Architecture](ARCHITECTURE.md)
- [Game State Machine](GAME_STATE_MACHINE.md)
- [Socket Protocol](SOCKET_PROTOCOL.md)
