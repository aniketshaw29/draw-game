# Room Management

How rooms are created, joined, and torn down. Implemented in `server/src/rooms.js`.

## Data structure

```js
const rooms = new Map();   // code -> Room

Room = {
  code: 'ABCD',
  players: new Map(),      // socketId -> Player
  hostId: 'socketId...',
  state: 'lobby',          // 'lobby' | 'playing' | 'gameover'
  game: null,              // set by game.js during play
  strokes: [],             // stroke history for replay
}
```

Player object:

```js
{
  id,            // socket.id
  name,          // sanitized nickname
  score: 0,
  isDrawer: false,
  hasGuessed: false,
}
```

## Codes

- 4 uppercase letters, e.g. `"QXPM"`.
- Generated randomly and retried until unique (`rooms.has(code)`).
- Lookup is case-insensitive on join.

## Creating a room

1. Client emits `createRoom { name }`.
2. Server generates a code, creates the `Room`, inserts the player as host.
3. Sends `roomState` back (client lands on the lobby screen).

## Joining a room

1. Client emits `joinRoom { code, name }`.
2. Reject with `error` if: code unknown, room full (8 max), or already in a room.
3. Otherwise add the player and broadcast the updated `roomState` + a
   `newMessage` system line ("Alice joined the room").
4. If the game is mid-round, the joiner gets the full stroke history to replay.

## Capacity

- Minimum to **start**: 2 players.
- Maximum per room: **8** players. Joins beyond that are rejected.

## Nickname rules

- Trimmed, 1–16 characters.
- Duplicate names within a room get a numeric suffix: `"Bob"` → `"Bob (2)"`.
- Empty names are replaced with `"Player"`.

## Leaving / disconnecting

On `leaveRoom` or socket `disconnect`:

1. Remove the player from the room.
2. Broadcast updated `roomState` + system message.
3. **Host migration**: if the host left, promote the oldest remaining player.
4. **Drawer left mid-round**: abort the round (`endRound(reason:'drawer_left')`),
   advance the round queue, continue or end the game.
5. **Game in progress**: the drawer queue is re-built skipping the departed player so
   everyone still draws once.
6. **Room empty**: delete the room (this also clears any running timer).

## Play again

- On `gameover`, the host emits `playAgain`.
- Scores reset to 0, all `hasGuessed`/`isDrawer` flags cleared, state → `lobby`,
  strokes cleared. Player list is preserved.
- Everyone gets `roomState` and returns to the lobby.

## Related Docs

- [Server Architecture](SERVER_ARCHITECTURE.md)
- [Game State Machine](GAME_STATE_MACHINE.md)
- [Socket Protocol](SOCKET_PROTOCOL.md)
