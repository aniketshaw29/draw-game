# Scoring

Rules for awarding points. Implemented server-side in `game.js` — clients just display.

## Points overview

| Event | Points |
|---|---|
| Guesser gets the word right | 100 → 10, decaying with time |
| Drawer, per player who guessed their word | same amount that guesser earned |
| Drawing nothing / nobody guesses | 0 |

## Tiered guessing points

The faster a correct guess, the more points. Decay is linear across the round.

```js
const MAX = 100;
const MIN = 10;

function guessPoints(round, elapsedMs) {
  const t = elapsedMs / (round.timeLimit * 1000);   // 0 → 1
  return Math.round(MAX - (MAX - MIN) * t);          // linear decay
}
```

- Round time limit default: **80 seconds**.
- Example: guess at 10s (t=0.125) → 89 pts; at 60s (t=0.75) → 33 pts.

## Drawer points

Each distinct player who guesses the word earns the drawer the **same** points that
guesser received (per-guesser, not a shared pool). So a drawer whose word was guessed
by 3 players at ~90 pts each gets ~270.

## Score application

```js
guesser.score += guessPoints(round, elapsed);
drawer.score += guessPoints(round, elapsed);
```

Both updates happen atomically when the guess is validated, then the room state is
emitted to all clients.

## Rules & safeguards

- A player can only score once per round (`hasGuessed` flag).
- The drawer's own chat messages never trigger scoring.
- If the round ends without guesses, nobody (including the drawer) scores.
- Scores are reset when a new game starts (`playAgain`), not between rounds.

## Scoreboard display

- Always sorted descending by score; ties broken by name.
- Live view shown during the game, full leaderboard on `gameEnd`.

## Related Docs

- [Game State Machine](GAME_STATE_MACHINE.md)
- [Socket Protocol](SOCKET_PROTOCOL.md)
