# Socket Protocol

The full event contract between client and server. All events travel over a single
Socket.io connection. Server payloads are scoped to the emitting room.

## Connection & namespaces

- Single default namespace. A client connects once at page load.
- The server tracks the room per socket via `socket.data.roomCode`.
- The server stores **only current players** on a socket; `roomState` is always the
  full source of truth for reconnects.

## Client → Server

| Event | Payload | Valid when | Server action |
|---|---|---|---|
| `createRoom` | `{ name }` | not in a room | Create room, join as host, emit `roomState` |
| `joinRoom` | `{ code, name }` | not in a room, code exists, < 8 players | Add player, emit `roomState` + `newMessage` (join) |
| `startGame` | — | sender is host, 2–8 players, state `lobby` | `game.js.startGame`, emit `roundStart` |
| `drawStroke` | `{ tool, color, size, points[] }` | sender is drawer, state `playing` | Validate, push to `strokes`, emit `newStroke` |
| `undoStroke` | — | sender is drawer | Pop last stroke, emit `strokeUndone` |
| `clearCanvas` | — | sender is drawer | Reset strokes, emit `canvasCleared` |
| `message` | `{ text }` | in a room, non-empty | Run guess filter (see below); emit `newMessage` (+ `correctGuess`) |
| `playAgain` | — | sender is host, state `gameover` | Reset to lobby (keep players, reset scores) |
| `leaveRoom` | — | in a room | `rooms.leave(socket)` |

## Server → Client

| Event | Payload | Sent when |
|---|---|---|
| `roomState` | full room snapshot | after create/join/leave, after `startGame` rejections, reconnect |
| `error` | `{ message }` | any invalid action |
| `roundStart` | `{ round, drawerId, wordLen, time, drawerName }` | new round begins |
| `timer` | `{ remaining }` | every second during a round |
| `newStroke` | `{ tool, color, size, points[] }` | drawer draws a stroke |
| `strokeUndone` | — | drawer undoes |
| `canvasCleared` | — | drawer clears |
| `newMessage` | `{ id, name, text, isCorrect, kind }` | any chat/guess/system message |
| `correctGuess` | `{ name, points }` | a player guesses correctly |
| `roundEnd` | `{ word, scores, reason }` | round finishes |
| `gameEnd` | `{ scores }` | final round finishes |

## Room snapshot shape (`roomState`)

```js
{
  code,                  // "ABCD"
  state,                 // 'lobby' | 'playing' | 'gameover'
  hostId,
  players: [             // sorted by score desc
    { id, name, score, isDrawer, hasGuessed }
  ],
  round: {               // present while playing
    number,
    drawerId,
    wordLen,             // number of letters (for the drawer's masked view)
    wordMask,            // e.g. "b a n a n a" for guessers
    timeLeft,
  } | null,
  strokes: [],           // full history, replayed by late joiners
}
```

The word itself is **never** sent to guessers — only `wordLen`/`wordMask`.

## Guess filter flow (`message` → `newMessage`)

```
receive { text }
   │
   ├─ player is drawer? ──────► chat-only message (kind:'chat'), no check
   │
   ├─ player already guessed? ─► chat-only, no check
   │
   ├─ normalize(text) === normalize(word)? ──► correct:
   │        award points, set hasGuessed
   │        emit newMessage { isCorrect: true }
   │        emit correctGuess { name, points }
   │        if all guessed → endRound
   │
   └─ else ──► emit newMessage { isCorrect: false, kind:'chat' }
```

## Reconnect behavior

1. Client socket disconnects → server marks the player absent but keeps them.
2. On `reconnect`, the server re-emits `roomState` (full snapshot) to the socket.
3. The client replays `strokes[]` onto its canvas.

## Related Docs

- [Architecture](ARCHITECTURE.md)
- [Client Architecture](CLIENT_ARCHITECTURE.md)
- [Guess Checking](GUESS_CHECKING.md)
