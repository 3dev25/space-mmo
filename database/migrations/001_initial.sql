CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(24) NOT NULL UNIQUE,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  credits BIGINT NOT NULL DEFAULT 10000 CHECK (credits >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ships_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price BIGINT NOT NULL CHECK (price >= 0),
  hull_hp INTEGER NOT NULL DEFAULT 100 CHECK (hull_hp > 0),
  cargo_capacity_kg NUMERIC(12,3) NOT NULL DEFAULT 100 CHECK (cargo_capacity_kg >= 0)
);
CREATE TABLE IF NOT EXISTS user_ships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  catalog_ship_id UUID NOT NULL REFERENCES ships_catalog(id),
  nickname TEXT,
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_z DOUBLE PRECISION NOT NULL DEFAULT 0,
  rotation_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS resources_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'kg',
  base_price BIGINT NOT NULL DEFAULT 1 CHECK (base_price >= 0)
);
CREATE TABLE IF NOT EXISTS user_resources (
  user_id UUID NOT NULL REFERENCES users(id),
  resource_id UUID NOT NULL REFERENCES resources_catalog(id),
  amount NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  PRIMARY KEY (user_id, resource_id)
);
INSERT INTO ships_catalog (name,description,price,hull_hp,cargo_capacity_kg)
VALUES ('Pioneer', 'Starter utility spacecraft for exploration and resource gathering.', 0, 100, 500)
ON CONFLICT (name) DO NOTHING;
INSERT INTO resources_catalog (name,base_price) VALUES ('Iron', 4), ('Copper', 6), ('Stone', 1)
ON CONFLICT (name) DO NOTHING;
