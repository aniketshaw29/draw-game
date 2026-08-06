# Running, Building & Deploying

Everything you need to run the game locally and ship it.

## Prerequisites

- Node.js ≥ 20 (tested on 22)
- npm

## Install

```bash
npm install            # root (workspace)
npm install --prefix server
npm install --prefix client
```

> If you keep a plain (non-workspace) monorepo, run the three installs above.

## Development (hot reload)

```bash
npm run dev
```

This starts both:

- **Client**: Vite dev server → `http://localhost:5173`
  - proxies `/socket.io` to the server, so no CORS issues.
- **Server**: Express + Socket.io → `http://localhost:3001`

Open two browser windows at `http://localhost:5173`, join the same room, play.

## Production build

```bash
npm run build     # builds client into client/dist
npm start         # Express serves client/dist + Socket.io on :3001
```

Visit `http://localhost:3001`.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | Server listen port |
| `ROUND_TIME` | `80` | Seconds per round |
| `MIN_PLAYERS` | `2` | Players required to start |
| `MAX_PLAYERS` | `8` | Room capacity |

## Deploying (any Node host)

1. Build the client (`npm run build`).
2. Upload the whole repo (or just `server/` + `client/dist`).
3. Run `npm start` behind a reverse proxy (nginx/Caddy/Fly/Railway render the SPA + proxy websockets).

### WebSocket notes for reverse proxies

- The client connects via Socket.io with path `/socket.io` (default). Ensure your proxy
  forwards it and enables WebSocket upgrade headers (`Upgrade`, `Connection`).
- nginx snippet:

```nginx
location /socket.io/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Statelessness caveat

All game state is in-memory. A server restart loses every room. For v1 this is fine;
for persistence you'd add Redis (socket.io adapter) + a store later.

## Verification checklist

- [ ] Create room from window A, join from window B
- [ ] Room full / bad code → friendly error
- [ ] Host starts; drawer sees the word, guessers see the mask
- [ ] Strokes appear live on both clients; undo & clear sync
- [ ] Correct guess → highlight, points awarded, word revealed to that player
- [ ] Round auto-advances; everyone draws once; leaderboard at the end
- [ ] Drawer disconnects mid-round → round aborts cleanly

## Related Docs

- [Architecture](ARCHITECTURE.md)
- [Server Architecture](SERVER_ARCHITECTURE.md)
