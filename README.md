# Heartline Racing

A private, real-time two-player racing game plus solo practice. The TypeScript/Vite canvas client deploys to GitHub Pages. The authoritative Colyseus `0.18.x` WebSocket service deploys separately.

## Local development

Requires Node 22+.

```bash
npm install
cp .env.example apps/web/.env.local
npm run dev
```

Open `http://localhost:5173` in two browser windows. Create a race in one, copy its invitation URL, and join in the other. The server runs at `http://localhost:2567`; health check: `curl http://localhost:2567/health`.

Controls: arrow keys or WASD steer/accelerate/brake, Space boosts. Phones receive five touch buttons below the track. Boost has a four-second cooldown. A disconnected player's slot remains reserved for 15 seconds; if they do not reconnect, they are removed and an active race ends with the remaining racer as winner. Pause is intentionally unavailable online because it would unfairly halt the opponent; leaving triggers the reconnect rule.

## Architecture and security

- `apps/web`: static Vite client. Sends only inputs, predicts the local car, and eases toward server snapshots.
- `apps/server`: authoritative 30 Hz Colyseus server. Owns movement, collisions, countdown, checkpoints, direction validation, laps, capacity, finish times, reconnection, and results.
- `packages/shared`: deterministic movement and race rules shared for prediction and tested independently.
- Rooms allow two clients. Colyseus reconnection tokens reserve identity; a new client cannot take that session. Profile/input shapes are validated, controls are clamped, and inbound messages are rate-limited.
- Production pages use HTTPS and must connect to a `wss://` endpoint. `VITE_SERVER_URL` is public configuration, not a secret. No secrets belong in Vite variables or source control.

## GitHub Pages frontend

1. Push the repository to GitHub.
2. In **Settings → Pages → Source**, select **GitHub Actions**.
3. Add repository variable `VITE_SERVER_URL` with `https://race.example.com`. Colyseus derives its secure `wss://` room connection from this HTTPS matchmaking origin.
4. Push `main` or run the workflow manually.

The workflow sets `VITE_BASE_PATH=/<repository>/`, ensuring assets load at `https://<owner>.github.io/<repository>/`. Only `apps/web/dist` is deployed. GitHub Pages cannot run the multiplayer server; the VPS below must remain online for online races. Solo practice remains available without it.

## Mac multiplayer server

The Mac can host the production server. It must remain powered on, awake, connected to the internet, and running Docker Desktop. Give the Mac a reserved LAN address in the router. Point a DNS hostname such as `race.example.com` to the home's public IP, then forward router TCP ports 80 and 443 plus UDP 443 to the Mac.

If the ISP uses CGNAT, blocks inbound ports, or the public IP changes frequently, normal port forwarding will not work reliably. Request a public/static IP or use a tunnel provider; do not expose port 2567 directly.

Create the local environment file. It is ignored by Git:

```bash
cp .env.example .env
# Edit .env: DOMAIN=race.your-domain.com
```

Start the game service and Caddy reverse proxy:

```bash
docker compose up -d --build
docker compose ps
curl https://race.your-domain.com/health
```

Caddy automatically obtains HTTPS certificates and proxies WebSocket upgrades, producing secure WSS. Only ports 80/443 are exposed. Both containers use `restart: unless-stopped`. For upgrades: `git pull && docker compose up -d --build`. For logs: `docker compose logs -f`. In Docker Desktop, enable **Start Docker Desktop when you sign in**. In macOS **System Settings → Lock Screen**, prevent automatic sleeping while the Mac is acting as the server.

Environment variables:

| Variable | Location | Example | Purpose |
|---|---|---|---|
| `VITE_SERVER_URL` | GitHub repository variable / web `.env.local` | `https://race.example.com` | Public matchmaking origin; room traffic uses WSS |
| `VITE_BASE_PATH` | Pages workflow | `/CarRace/` | Repository subpath |
| `PORT` | Server container | `2567` | Internal listen port |
| `DOMAIN` | Mac's ignored `.env` | `race.example.com` | Public server hostname used by Caddy |

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
docker compose build
```

Manual release pass: use two separate browser profiles/devices; create/join via invitation; verify third-client rejection, readiness, synchronized countdown, three laps, touch controls, boost, results, and rematch. Disable one client's network for under/over 15 seconds to verify reconnect/resignation. Restart the server and verify clients clearly disconnect. Test a production Pages URL and confirm DevTools connects to `wss://`, with assets served beneath the repository subpath.

## Assets and limits

No image, audio, or game asset files are used. Visuals are original canvas/CSS shapes. Google Fonts (`DM Sans`, `Racing Sans One`) use the SIL Open Font License. Sound control is present but the current build has no sound effects. Current scope has one polished track, two racers, in-memory rooms, and no spectator mode or persistent leaderboard. Server restarts end active races.
