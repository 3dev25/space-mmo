export type Vector3 = { x: number; y: number; z: number };
export type PlayerSnapshot = { id: string; username: string; position: Vector3; rotationY: number };
export type WorldSnapshot = { tick: number; players: PlayerSnapshot[] };
export type ClientInput = { forward: number; turn: number };
