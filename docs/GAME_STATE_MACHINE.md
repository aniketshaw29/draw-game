# Game State Machine

The authoritative flow of a game, owned entirely by the server (`game.js`).

## Room-level states

```
        create/join
             │
             ▼
        ┌────────┐   startGame (host, 2-8 players)
        │ lobby  │ ──────────────────────────────►
        └────────┘                                 │
             ▲                                     ▼
             │                              ┌──────────┐
        playAgain (gameover)                │ playing  │ ──► round loop
             │                              └──────────┘
             ▼                                     │
        ┌───────────┐                              │ final round done
        │ gameover  │ ◄─────────────────────────────┘
        └───────────┘
```

## Round loop (inside `playing`)

Each round is an instance of the following machine:

```
 startRound
     │
     ▼
┌─────────────┐   emit roundStart {drawer, wordLen, time}
│  round      │   timer = 80s, guesses reset, strokes reset
└─────────────┘
     │  timer tick → emit timer {remaining}
     │
     ├───────────────────────────────┬───────────────────────────┐
     ▼                               ▼                           ▼
  all guessed?                  drawer left?               timer = 0
     │                               │                           │
     └───────────┬───────────────────┴───────────────────────────┘
                 ▼
        ┌──────────────┐
        │   roundEnd   │   emit roundEnd {word, scores}
        └──────────────┘
                 │ 5s reveal (WordReveal screen on clients)
                 ▼
        ┌───────────────────┐
        │  last round?      │
        └──────┬───────┬────┘
        no     │       │ yes
               ▼       ▼
         startRound  endGame → emit gameEnd {scores}
```

## Round data structure

```js
round = {
  number,       // 1-based
  drawerId,
  word,         // hidden from guessers on the wire
  startsAt,     // timestamp for tiered scoring
  timeLimit,    // seconds, default 80
  guesses: { playerId: points },  // who already guessed correctly
  ended: false,
}
```

## Timer implementation

- One `setInterval(1s)` per active round, stored on `room.game.timer`.
- Each tick: decrement `remaining`, emit `timer { remaining }`.
- At 0 → `endRound(room, 'timeout')`.
- **Always** `clearInterval` in `endRound` and when the drawer disconnects.
- Guard against double-end with `round.ended` flag.

## Edge cases

| Case | Behavior |
|---|---|
| Drawer disconnects mid-round | Abort round (no points), start next round or gameover |
| Guesser disconnects mid-round | Removed from room; if game in progress, their entry in the drawer queue is skipped |
| Everyone guesses | End round early immediately |
| All players leave | Delete room, clear timers |
| Host leaves mid-game | Promote the next player to host |
| Player joins mid-game | Allowed; added to scoreboard with 0, cannot draw this cycle |

## Related Docs

- [Architecture](ARCHITECTURE.md)
- [Socket Protocol](SOCKET_PROTOCOL.md)
- [Scoring](SCORING.md)
