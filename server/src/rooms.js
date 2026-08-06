const rooms = new Map();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

export const MIN_PLAYERS = Number(process.env.MIN_PLAYERS || 2);
export const MAX_PLAYERS = Number(process.env.MAX_PLAYERS || 8);

function generateCode() {
  let code;
  do {
    code = Array.from(
      { length: 4 },
      () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
    ).join('');
  } while (rooms.has(code));
  return code;
}

export function getRoom(code) {
  return code ? rooms.get(String(code).trim().toUpperCase()) : null;
}

export function findRoomBySocket(socket) {
  return socket.data.roomCode ? rooms.get(socket.data.roomCode) : null;
}

export function createRoom(socket) {
  const code = generateCode();
  const room = {
    code,
    players: new Map(),
    hostId: socket.id,
    state: 'lobby',
    game: null,
  };
  rooms.set(code, room);
  return room;
}

export function sanitizeName(name) {
  const cleaned = String(name || '').trim().slice(0, 16);
  return cleaned || 'Player';
}

export function uniqueName(room, name) {
  const names = new Set([...room.players.values()].map((p) => p.name));
  if (!names.has(name)) return name;
  let i = 2;
  while (names.has(`${name} (${i})`)) i += 1;
  return `${name} (${i})`;
}

export function addPlayer(room, socket, name) {
  const player = {
    socket,
    id: socket.id,
    name: uniqueName(room, sanitizeName(name)),
    score: 0,
    isDrawer: false,
    hasGuessed: false,
  };
  room.players.set(socket.id, player);
  socket.join(room.code);
  return player;
}

export function removePlayer(room, socket) {
  const player = room.players.get(socket.id);
  room.players.delete(socket.id);
  socket.leave(room.code);
  socket.data.roomCode = null;
  return player;
}

export function promoteHost(room) {
  const next = [...room.players.keys()][0] ?? null;
  room.hostId = next;
}

export function deleteRoom(room) {
  rooms.delete(room.code);
}
