import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';
import { users, findUser } from './users.js';

const app = express();
app.use(cors());
app.use(express.json());

const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, PORT = 3000 } = process.env;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
  console.error('Missing LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET in .env');
  process.exit(1);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/users', (_req, res) => res.json(users));

app.post('/token', async (req, res) => {
  const { userId, room } = req.body || {};
  if (!userId || !room) {
    return res.status(400).json({ error: 'userId and room are required' });
  }

  const user = findUser(userId);
  if (!user) return res.status(404).json({ error: 'user not found' });

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: user.id,
    name: user.name,
    ttl: 60 * 60,
  });
  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();
  res.json({ token, url: LIVEKIT_URL, identity: user.id, room });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`LiveKit URL: ${LIVEKIT_URL}`);
});
