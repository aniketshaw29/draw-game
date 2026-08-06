import {
  createRoom,
  addPlayer,
  removePlayer,
  promoteHost,
  deleteRoom,
  getRoom,
  findRoomBySocket,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from './rooms.js';
import { startGame, handleGuess, playAgain, abortRound, clearTimer } from './game.js';
import { emitToRoom, sendState, chatId } from './state.js';

function emitError(socket, message) {
  socket.emit('error', { message });
}

function systemMessage(room, text) {
  emitToRoom(room, 'newMessage', {
    id: chatId(),
    name: 'system',
    text,
    kind: 'system',
    isCorrect: false,
  });
}

function sanitizeStroke(stroke) {
  if (!stroke || typeof stroke !== 'object') return null;
  const id = typeof stroke.id === 'string' ? stroke.id : null;
  const tool = stroke.tool === 'eraser' ? 'eraser' : 'brush';
  const color = typeof stroke.color === 'string' ? stroke.color.slice(0, 9) : '#000000';
  const size = Number.isFinite(stroke.size) ? Math.min(60, Math.max(1, stroke.size)) : 4;
  const points = Array.isArray(stroke.points)
    ? stroke.points
        .slice(0, 400)
        .map((p) =>
          Number.isFinite(p?.x) && Number.isFinite(p?.y)
            ? { x: Math.round(p.x), y: Math.round(p.y) }
            : null,
        )
        .filter(Boolean)
    : [];
  if (!id || points.length === 0) return null;
  return { id, tool, color, size, points };
}

export function setupSocket(io, socket) {
  socket.on('createRoom', ({ name }) => {
    if (socket.data.roomCode) return emitError(socket, 'You are already in a room.');
    const room = createRoom(socket);
    socket.data.roomCode = room.code;
    addPlayer(room, socket, name);
    sendState(room);
  });

  socket.on('joinRoom', ({ code, name }) => {
    if (socket.data.roomCode) return emitError(socket, 'You are already in a room.');
    const room = getRoom(code);
    if (!room) return emitError(socket, 'Room not found. Check the code.');
    if (room.players.size >= MAX_PLAYERS) return emitError(socket, 'This room is full.');
    const player = addPlayer(room, socket, name);
    socket.data.roomCode = room.code;
    systemMessage(room, `${player.name} joined the room.`);
    sendState(room);
  });

  socket.on('startGame', () => {
    const room = findRoomBySocket(socket);
    if (!room) return emitError(socket, 'You are not in a room.');
    if (socket.id !== room.hostId) return emitError(socket, 'Only the host can start the game.');
    if (room.state !== 'lobby') return emitError(socket, 'A game is already running.');
    if (room.players.size < MIN_PLAYERS) {
      return emitError(socket, `Need at least ${MIN_PLAYERS} players to start.`);
    }
    room.state = 'playing';
    startGame(room);
  });

  socket.on('drawStroke', (stroke) => {
    const room = findRoomBySocket(socket);
    const round = room?.game?.round;
    if (!room || !round || round.ended) return;
    if (socket.id !== round.drawerId) return;
    const clean = sanitizeStroke(stroke);
    if (!clean) return;
    room.game.strokes.push(clean);
    emitToRoom(room, 'newStroke', clean);
  });

  socket.on('undoStroke', () => {
    const room = findRoomBySocket(socket);
    const round = room?.game?.round;
    if (!room || !round || round.ended) return;
    if (socket.id !== round.drawerId) return;
    const popped = room.game.strokes.pop();
    if (popped) emitToRoom(room, 'strokeUndone', { id: popped.id });
  });

  socket.on('clearCanvas', () => {
    const room = findRoomBySocket(socket);
    const round = room?.game?.round;
    if (!room || !round || round.ended) return;
    if (socket.id !== round.drawerId) return;
    room.game.strokes = [];
    emitToRoom(room, 'canvasCleared', {});
  });

  socket.on('message', ({ text }) => {
    const room = findRoomBySocket(socket);
    const player = room?.players.get(socket.id);
    if (!room || !player) return;
    const cleaned = String(text || '').trim().slice(0, 200);
    if (!cleaned) return;

    const correct = handleGuess(room, player, cleaned);
    emitToRoom(room, 'newMessage', {
      id: chatId(),
      name: player.name,
      text: cleaned,
      isCorrect: Boolean(correct),
      kind: player.id === room.game?.round?.drawerId ? 'chat' : 'guess',
    });
  });

  socket.on('playAgain', () => {
    const room = findRoomBySocket(socket);
    if (!room) return emitError(socket, 'You are not in a room.');
    if (socket.id !== room.hostId) return emitError(socket, 'Only the host can restart.');
    if (room.state !== 'gameover') return emitError(socket, 'Game is not over yet.');
    playAgain(room);
  });

  socket.on('leaveRoom', () => {
    const room = findRoomBySocket(socket);
    if (room) handleLeave(room, socket);
  });

  socket.on('disconnect', () => {
    const room = findRoomBySocket(socket);
    if (room) handleLeave(room, socket);
  });
}

function handleLeave(room, socket) {
  const wasDrawer = room.game?.round?.drawerId === socket.id;
  const player = removePlayer(room, socket);

  if (room.game) {
    room.game.order = room.game.order.filter((id) => id !== socket.id);
    room.game.rounds = Math.min(room.game.order.length, 8);
  }

  if (room.players.size === 0) {
    clearTimer(room);
    deleteRoom(room);
    return;
  }

  promoteHost(room);
  if (player) systemMessage(room, `${player.name} left the room.`);
  if (wasDrawer) {
    abortRound(room);
  } else {
    sendState(room);
  }
}
