# Space MMO

Browser-based space trading and exploration prototype built with React, TypeScript, Three.js/WebGL, Node.js, Fastify, Socket.IO, and PostgreSQL.

## MVP scope
- Account registration/login with JWT in HTTP-only cookies
- PostgreSQL-backed users and wallets
- A shared local solar-system scene rendered in Three.js
- Server-authoritative movement simulation with Socket.IO snapshots
- Starter catalog and foundations for ships, equipment, mining, and trading

> This repository is a development starter. Mining, player market matching, and full ship/equipment CRUD are planned modules, not yet production-complete gameplay.

## Requirements
- Node.js 20+
- npm 10+
- PostgreSQL 16

## Local setup
1. Copy `.env.example` to `.env` and set secrets/database credentials.
2. Start PostgreSQL: `docker compose up -d db`
3. Install packages: `npm install`
4. Apply the SQL migration: `npm run db:migrate`
5. Start API and client: `npm run dev`
6. Open `http://localhost:5173` (API health: `http://localhost:3000/health`).

## Workspace layout
- `apps/client` React + Vite + Three.js client
- `apps/server` Fastify API and Socket.IO world simulation
- `packages/shared` shared protocol types
- `database/migrations` SQL schema migrations
- `docs` architecture and gameplay notes

## Security notes
Passwords are hashed with Argon2id. JWT is held in an HTTP-only, SameSite cookie. Configure `COOKIE_SECURE=true` behind HTTPS. Do not commit `.env` files.

## Roadmap
See [docs/ROADMAP.md](docs/ROADMAP.md).