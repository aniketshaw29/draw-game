# Canvas & Real-time Sync

How drawing works on the client and how strokes stay in sync across the room.

## Stroke model

A drawing is a list of **vector strokes** (not pixels). This is what makes
realtime sync, undo, clear, and late-joiner replay trivial.

```js
// one stroke
{
  tool: 'brush' | 'eraser',
  color: '#000000',
  size: 4,              // brush width in px
  points: [             // captured pointer positions
    { x, y }, { x, y }, ...
  ],
}
```

Pixel data is never sent over the wire.

## Client capture (Canvas.jsx)

1. Pointer events: `pointerdown` → start stroke; `pointermove` → append points;
   `pointerup` → finalize and emit.
2. **Throttle** points to ~every 15px or 16ms to keep payloads small while staying smooth.
3. `setPointerCapture` so strokes keep flowing even when the cursor leaves the canvas.
4. Touch works for free via Pointer Events.

```
pointerdown → beginStroke → emit nothing yet
pointermove → push point → render locally (lineTo) 
pointerup   → emit drawStroke { tool, color, size, points }
```

The drawer draws locally **first** for zero latency, then the server echoes the stroke
back to everyone (including the drawer, which is a no-op redraw).

## Rendering a stroke (replay)

```js
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = color;
ctx.lineWidth = size;
ctx.beginPath();
points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
ctx.stroke();
```

Eraser is implemented as a stroke drawn with the canvas background color, keeping the
stroke model uniform.

## Sync strategy

| Channel | How |
|---|---|
| Live strokes | `newStroke` broadcast by the server to all room members |
| Undo | `strokeUndone` → each client pops its own stroke list & redraws |
| Clear | `canvasCleared` → each client wipes canvas |
| Late joiner | `roomState.strokes[]` full history → replay all strokes on mount |

### Redraw approach

Clients keep the full local stroke array. On undo/clear/replay they just **clear the
canvas and re-render all strokes** — simpler than destructive pixel editing and fast
enough for < few hundred strokes.

## Rate & size limits

- Cap points per stroke (e.g. 400) to prevent runaway payloads.
- Cap total strokes per round (e.g. 1000).
- Canvas is drawn to the container; coordinates sent as **CSS pixels** (same scale on
  every client) so no remapping is needed. Device-pixel-ratio scaling happens only
  locally for crispness.

## Who can draw

- Only the current drawer's `drawStroke/undoStroke/clearCanvas` are honored by the
  server (validated by socket). Guessers' canvases are read-only (`pointer-events:none`).
- Every client renders every stroke, so the board is identical for everyone.

## Related Docs

- [Architecture](ARCHITECTURE.md)
- [Socket Protocol](SOCKET_PROTOCOL.md)
- [Client Architecture](CLIENT_ARCHITECTURE.md)
