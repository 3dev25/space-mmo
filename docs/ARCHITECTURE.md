# Architecture overview

## Current implementation
TypeScript monorepo with React/Vite client and Fastify API. PostgreSQL stores accounts, wallets, ship/resource catalog, ownership and balances. Socket.IO distributes a shared simple world state.

### Client
Three.js scene contains star field, navigation grid, central star, sample planet, and peer ship meshes. WASD/arrows control thrust and rotation.

### Server
Fastify routes: health, registration, login, logout, current user. Argon2id password hashing and JWT HTTP-only cookie. Zod validates input. Socket.IO runs a basic movement simulation and broadcasts snapshots at 10 Hz.

### Database
Migration 001 establishes user/wallet, ship catalog and ownership, resource catalog and balances. Seed inserts are idempotent.

## Critical next steps
1. Authenticate Socket.IO sessions; current demo sockets are anonymous.
2. Bind connections to users and active ships; persist positions.
3. Rate limiting, bounded movement, collision and AOI filtering.
4. Implement hangar, equipment, cargo, atomic market operations.
5. Server-validated mining with asteroid reserves.
6. Tests, migration history, deployment config, CI and observability.

Prototype world loop is not production hardened.
