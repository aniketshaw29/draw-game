# Guess Checking

How the server decides whether a chat message is a correct guess.

## Normalization

Both the guess and the answer word are normalized before comparison:

```js
const normalize = s =>
  s.toLowerCase()
   .trim()
   .replace(/[^a-z0-9\s]/g, '')   // strip punctuation/symbols
   .replace(/\s+/g, ' ');          // collapse whitespace
```

So `"A BANANA!!"`, `"banana"`, and `"  Banana "` all equal `"banana"`.

## Comparison rules

1. **Exact match** after normalization → correct.
2. **StartsWith** when the guess is within 1 letter of the word length and matches
   (catches plural/tense slips like `"bananas"` for `"banana"`).
3. Everything else → wrong guess, shown in chat with no points.

Order of checks:

```js
function checkGuess(word, guess) {
  const a = normalize(word);
  const b = normalize(guess);
  if (a === b) return true;
  if (Math.abs(a.length - b.length) <= 1 && b.startsWith(a)) return true;
  return false;
}
```

## Guard rails

| Rule | Behavior |
|---|---|
| Drawer's messages | never checked — treated as chat |
| Already-guessed player | never checked again — treated as chat |
| Empty / whitespace | rejected before filtering |
| Spam (many wrong guesses) | v1: allowed; optional rate-limit noted for later |
| Word with multiple words | spaces preserved in the mask, normalization still works |

## Word masking (for guessers)

The server only ever reveals a mask, never the word:

```js
function mask(word) {
  return word.replace(/\S/g, '_').replace(/(_)/g, '$1 ').trim();
}
// "banana" → "_ _ _ _ _ _"
// "ice cream" → "_ _ _   _ _ _ _ _"
```

Once a player guesses correctly, the client reveals the word to them only
(their round payload updates to include `word` for that specific player).

## Related Docs

- [Socket Protocol](SOCKET_PROTOCOL.md)
- [Scoring](SCORING.md)
- [Game State Machine](GAME_STATE_MACHINE.md)
