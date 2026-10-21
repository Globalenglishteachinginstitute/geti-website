# SpeakTogether Live — real voice practice

A Free4Talk-inspired language practice community. Real visitors share rooms through Socket.IO and speak using peer-to-peer WebRTC microphone audio. No simulated users or fabricated online counts.

## Run on your computer

Install Node.js 18+. Open a terminal in this folder:

```bash
npm install
npm start
```

Open http://localhost:3000. Sign in with a nickname, create a room, then use **Copy invitation link** to invite another person. Each visitor needs their own browser/device and microphone permission. For remote visitors, **publish to HTTPS first**.

## Publish with Render (simplest)

1. Create a GitHub repository and upload **the contents of this folder** (`server.js`, `package.json`, `public/`, `render.yaml`). Do **not** upload only `index.html`.
2. Visit https://dashboard.render.com/ and select **New → Blueprint**; choose the GitHub repository and approve `render.yaml`. Alternatively create a **Web Service** with build command `npm install`, start command `npm start`, Node runtime, and `/health` as health check.
3. Wait for deployment and open the provided `https://…onrender.com` URL.
4. On two devices, open the site, use distinct nicknames, join the same room and enable the microphone. Use headphones.
5. Invite others with the room's link. On Render's free tier, the server may sleep after inactivity and take time to wake up.

**GitHub Pages alone cannot run this application**: a Node.js server is required for live shared rooms and WebRTC signaling. Use a single instance; multi-instance deployment requires a Socket.IO adapter and shared storage.

## Optional TURN relay (important for reliable international calls)

Free public STUN alone is not sufficient for many mobile/corporate networks. Provision a TURN server and set `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` in your host's environment. These values are exposed to clients for WebRTC; use temporary TURN credentials for serious production usage rather than a static long-lived shared account.

## Important limitations before public launch

- The "Sign in" button is **nickname only**, not secure authentication. Do not call it an account system.
- Room names survive server restarts *only when* `rooms.json` is preserved. Many hosts have ephemeral filesystems, so use a database for persistence.
- Participant counts represent people currently connected to this one server, not worldwide activity.
- Live audio requires browser microphone permission and HTTPS or localhost. WebRTC may fail without TURN on some networks.
- This is a small-room prototype with a cap of six people, no real accounts, banning, abuse reporting, moderation, text chat or recordings. Add safeguards before inviting unrestricted public traffic.
- Dependency install and live WebRTC calls need to be tested on your deployed server and two different networks. Source syntax checks do not establish successful calls.
