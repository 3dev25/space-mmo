import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import argon2 from 'argon2';
import { z } from 'zod';
import { Server } from 'socket.io';
import { pool } from './db/pool.js';
import type { PlayerSnapshot, WorldSnapshot, ClientInput } from '@space-mmo/shared';

const app = Fastify({ logger: true });
const origin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
await app.register(cors, { origin, credentials: true });
await app.register(cookie);
await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'dev-secret-change-me', cookie: { cookieName: 'token', signed: false }, sign: { expiresIn: '7d' } });
app.get('/health', async () => ({ status: 'ok' }));
const registerSchema = z.object({ username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/), email: z.string().email().max(254), password: z.string().min(8).max(128) });
app.post('/auth/register', async (request, reply) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Invalid registration data', details: parsed.error.flatten() });
  const { username, email, password } = parsed.data;
  try {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query('INSERT INTO users(username,email,password_hash) VALUES($1,$2,$3) RETURNING id,username,email', [username, email.toLowerCase(), passwordHash]);
      await client.query('INSERT INTO wallets(user_id,credits) VALUES($1,10000)', [inserted.rows[0].id]);
      await client.query('COMMIT');
      const user = inserted.rows[0];
      const token = app.jwt.sign({ sub: user.id, username: user.username });
      reply.setCookie('token', token, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
      return reply.code(201).send({ user });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch (error: any) { if (error?.code === '23505') return reply.code(409).send({ error: 'Username or email already exists' }); throw error; }
});
app.post('/auth/login', async (request, reply) => {
  const body = z.object({ login: z.string().min(1), password: z.string().min(1) }).safeParse(request.body);
  if (!body.success) return reply.code(400).send({ error: 'Invalid login data' });
  const result = await pool.query('SELECT id,username,email,password_hash FROM users WHERE username=$1 OR email=$1', [body.data.login.toLowerCase()]);
  const user = result.rows[0];
  if (!user || !(await argon2.verify(user.password_hash, body.data.password))) return reply.code(401).send({ error: 'Invalid credentials' });
  const token = app.jwt.sign({ sub: user.id, username: user.username });
  reply.setCookie('token', token, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
  return { user: { id: user.id, username: user.username, email: user.email } };
});
app.post('/auth/logout', async (_request, reply) => { reply.clearCookie('token', { path: '/' }); return { ok: true }; });
app.get('/me', async (request, reply) => { try { await request.jwtVerify(); return { user: request.user }; } catch { return reply.code(401).send({ error: 'Unauthorized' }); } });
const httpServer = await app.listen({ port: Number(process.env.API_PORT ?? 3000), host: '0.0.0.0' });
const io = new Server(httpServer, { cors: { origin, credentials: true } });
const players = new Map<string, PlayerSnapshot>();
const inputs = new Map<string, ClientInput>();
let tick = 0;
io.on('connection', socket => {
  const id = socket.id;
  players.set(id, { id, username: `Pilot-${id.slice(0,5)}`, position: { x: Math.random()*60-30, y: 0, z: Math.random()*60-30 }, rotationY: 0 });
  inputs.set(id, { forward: 0, turn: 0 });
  socket.on('input', (raw: unknown) => { const parsed = z.object({ forward: z.number().min(-1).max(1), turn: z.number().min(-1).max(1) }).safeParse(raw); if (parsed.success) inputs.set(id, parsed.data); });
  socket.on('disconnect', () => { players.delete(id); inputs.delete(id); });
});
setInterval(() => {
  tick++;
  for (const [id, player] of players) { const input = inputs.get(id) ?? { forward: 0, turn: 0 }; player.rotationY += input.turn * 0.035; player.position.x += Math.sin(player.rotationY) * input.forward * 0.12; player.position.z += Math.cos(player.rotationY) * input.forward * 0.12; }
  const snapshot: WorldSnapshot = { tick, players: [...players.values()] };
  io.emit('world:snapshot', snapshot);
}, 100);
