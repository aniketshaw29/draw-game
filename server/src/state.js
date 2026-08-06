import { mask } from './words.js';

export function snapshot(room, selfId) {
  const round = room.game?.round || null;
  const me = room.players.get(selfId);
  const players = [...room.players.values()]
    .map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isDrawer: p.isDrawer,
      hasGuessed: p.hasGuessed,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const seesWord = round && me && (me.id === round.drawerId || me.hasGuessed);

  return {
    code: room.code,
    state: room.state,
    hostId: room.hostId,
    selfId,
    players,
    round: round
      ? {
          number: round.number,
          drawerId: round.drawerId,
          word: seesWord ? round.word : undefined,
          wordMask: seesWord ? undefined : mask(round.word),
          timeLeft: Math.max(0, Math.ceil(
            (round.startsAt + round.timeLimit * 1000 - Date.now()) / 1000,
          )),
        }
      : null,
    strokes: room.game ? room.game.strokes : [],
  };
}

export function sendState(room) {
  if (!room) return;
  room.players.forEach((p) => p.socket.emit('roomState', snapshot(room, p.id)));
}

export function scoreboard(room) {
  return [...room.players.values()]
    .map((p) => ({ id: p.id, name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function emitToRoom(room, event, payload) {
  if (!room) return;
  room.players.forEach((p) => p.socket.emit(event, payload));
}

export function chatId() {
  return crypto.randomUUID();
}
