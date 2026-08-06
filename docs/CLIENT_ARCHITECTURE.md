# Client Architecture

Details of the React (Vite) single-page app in `client/`.

## Layout

```
client/
├── package.json          # deps: react, react-dom, socket.io-client; dev: vite
├── vite.config.js        # dev server on :5173, proxy /socket.io → :3001
├── index.html
└── src/
    ├── main.jsx          # React root
    ├── App.jsx           # screen router
    ├── socket.js         # socket.io connection + typed emit helpers
    └── components/
        ├── Home.jsx
        ├── Lobby.jsx
        ├── Game.jsx
        ├── Canvas.jsx
        ├── Chat.jsx
        ├── Scoreboard.jsx
        └── WordReveal.jsx
```

## App.jsx — screen router

The app is a state machine over four screens driven by server events:

| Screen | Shown when | Server event that enters it |
|---|---|---|
| `home` | before joining | — (initial) |
| `lobby` | `roomState.state === 'lobby'` | `roomState` |
| `game` | `roundStart` | `roundStart` |
| `gameover` | `gameEnd` | `gameEnd` |

The client keeps a light local copy of room state:

```js
const [screen, setScreen] = useState('home');
const [room, setRoom] = useState(null);      // latest room snapshot
const [myId, setMyId] = useState(null);
```

Socket events in `App.jsx`:
- `roomState` → set room + screen (lobby if `state==='lobby'`)
- `roundStart` → set round data + screen = game
- `gameEnd` → screen = gameover
- `error` → toast/inline banner

## socket.js — connection wrapper

- Single `io()` connection created at startup (auto-connects to same origin; Vite proxies).
- Reconnect handling: on `disconnect`, UI shows "reconnecting…"; on `reconnect`, the
  server re-sends `roomState`.
- Small typed helpers so components don't repeat emit calls:

```js
export const socket = io();
export const api = {
  createRoom: name => socket.emit('createRoom', { name }),
  joinRoom: (code, name) => socket.emit('joinRoom', { code, name }),
  startGame: () => socket.emit('startGame'),
  drawStroke: s => socket.emit('drawStroke', s),
  undo: () => socket.emit('undoStroke'),
  clear: () => socket.emit('clearCanvas'),
  message: text => socket.emit('message', { text }),
  playAgain: () => socket.emit('playAgain'),
};
```

## Component responsibilities

### Home.jsx
- Nickname input (persisted to `localStorage` for next visit).
- "Create Room" button and "Join" input (4-letter code).
- Emits `createRoom` / `joinRoom`.

### Lobby.jsx
- Shows 4-letter room code + share hint.
- Player list with scores and a crown on the host.
- Host sees a **Start Game** button (disabled unless 2–8 players).
- Emits `startGame`.

### Game.jsx
- Layout grid: canvas (left), chat + scoreboard (right).
- Renders the current round info:
  - **Drawer**: "You are drawing — the word is **____**".
  - **Guessers**: shows masked word `_ _ _ _`.
- Hosts the timer countdown from `timer` events.

### Canvas.jsx
- `<canvas>` with pointer events → strokes. See [Canvas & Real-time Sync](CANVAS_AND_REALTIME.md).
- Toolbar: color swatches, brush size, eraser, undo, clear.
- Drawer-only controls; guessers see a read-only canvas.
- Plays back `newStroke` events and replays `strokes[]` from `roomState`.

### Chat.jsx
- Message list + input.
- Guessers' input is routed as guesses; drawer's input is chat-only.
- Renders:
  - normal messages grey,
  - correct guesses with a colored highlight,
  - system messages (player joined/left, correct guesses).
- Shows "You guessed the word!" banner for the player's own correct guess.

### Scoreboard.jsx
- Live score list sorted desc.
- Final leaderboard view for `gameover` with Play Again button (host).

### WordReveal.jsx
- Shows the word big + scores during the 5s reveal between rounds.

## State flow on the client

The client never computes authoritative game logic. It only:
1. Renders `room`/round data pushed by the server.
2. Fires user intents via `api.*`.

This keeps every client in sync with zero reconciliation logic.

## Related Docs

- [Architecture](ARCHITECTURE.md)
- [Socket Protocol](SOCKET_PROTOCOL.md)
- [Canvas & Real-time Sync](CANVAS_AND_REALTIME.md)
