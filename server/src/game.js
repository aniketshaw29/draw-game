import { pickWord, mask, checkGuess } from './words.js';
import { emitToRoom, scoreboard, sendState } from './state.js';

const ROUND_TIME = Number(process.env.ROUND_TIME || 80);
const REVEAL_MS = 5000;
const MAX_SCORE = 100;
const MIN_SCORE = 10;

function guessPoints(round) {
  const elapsed = (Date.now() - round.startsAt) / 1000;
  const t = Math.min(1, Math.max(0, elapsed / round.timeLimit));
  return Math.round(MAX_SCORE - (MAX_SCORE - MIN_SCORE) * t);
}

export function startGame(room) {
  const order = [...room.players.keys()];
  room.game = {
    rounds: Math.min(order.length, 8),
    order,
    drawerIndex: 0,
    round: null,
    timer: null,
    usedWords: new Set(),
    strokes: [],
  };
  startRound(room);
}

export function startRound(room) {
  const g = room.game;
  g.roundNumber = (g.roundNumber || 0) + 1;
  const drawerId = g.order[g.drawerIndex % g.order.length];
  g.drawerIndex += 1;
  const drawer = room.players.get(drawerId);

  room.players.forEach((p) => {
    p.isDrawer = false;
    p.hasGuessed = false;
  });
  if (drawer) drawer.isDrawer = true;

  const round = {
    number: g.roundNumber,
    drawerId,
    word: pickWord(g.usedWords),
    timeLimit: ROUND_TIME,
    startsAt: Date.now(),
    ended: false,
  };
  g.round = round;
  g.strokes = [];

  const timeLeft = ROUND_TIME;
  room.players.forEach((p) => {
    p.socket.emit('roundStart', {
      round: round.number,
      rounds: g.rounds,
      drawerId,
      drawerName: drawer?.name || '',
      timeLimit: ROUND_TIME,
      timeLeft,
      word: p.id === drawerId ? round.word : undefined,
      wordMask: p.id === drawerId ? undefined : mask(round.word),
    });
  });

  startTimer(room);
  sendState(room);
}

function startTimer(room) {
  clearTimer(room);
  const g = room.game;
  g.timer = setInterval(() => {
    const round = g.round;
    if (!round || round.ended) {
      clearTimer(room);
      return;
    }
    const remaining = Math.max(0, Math.ceil(
      (round.startsAt + round.timeLimit * 1000 - Date.now()) / 1000,
    ));
    emitToRoom(room, 'timer', { remaining });
    if (remaining <= 0) endRound(room, 'timeout');
  }, 1000);
}

export function clearTimer(room) {
  if (room.game?.timer) {
    clearInterval(room.game.timer);
    room.game.timer = null;
  }
  if (room.nextRoundTimer) {
    clearTimeout(room.nextRoundTimer);
    room.nextRoundTimer = null;
  }
}

export function handleGuess(room, player, text) {
  const round = room.game?.round;
  if (!round || round.ended) return null;
  if (player.id === round.drawerId || player.hasGuessed) return null;
  if (!checkGuess(round.word, text)) return null;

  const points = guessPoints(round);
  player.hasGuessed = true;
  player.score += points;
  const drawer = room.players.get(round.drawerId);
  if (drawer) drawer.score += points;

  player.socket.emit('yourGuessCorrect', { word: round.word, points });
  emitToRoom(room, 'correctGuess', { name: player.name, points });
  sendState(room);

  const guessers = [...room.players.values()].filter((p) => p.id !== round.drawerId);
  if (guessers.length > 0 && guessers.every((p) => p.hasGuessed)) {
    endRound(room, 'all_guessed');
  }
  return { points, word: round.word };
}

function endRound(room, reason) {
  const g = room.game;
  const round = g?.round;
  if (!round || round.ended) return;
  round.ended = true;
  clearTimer(room);

  const scores = scoreboard(room);
  emitToRoom(room, 'roundEnd', { word: round.word, reason, scores });
  sendState(room);

  if (g.roundNumber >= g.rounds) {
    room.nextRoundTimer = setTimeout(() => endGame(room), REVEAL_MS);
  } else {
    room.nextRoundTimer = setTimeout(() => startRound(room), REVEAL_MS);
  }
}

export function abortRound(room) {
  if (room.game?.round && !room.game.round.ended) endRound(room, 'drawer_left');
}

function endGame(room) {
  clearTimer(room);
  room.state = 'gameover';
  const scores = scoreboard(room);
  emitToRoom(room, 'gameEnd', { scores });
  sendState(room);
}

export function playAgain(room) {
  clearTimer(room);
  room.players.forEach((p) => {
    p.score = 0;
    p.isDrawer = false;
    p.hasGuessed = false;
  });
  room.state = 'lobby';
  room.game = null;
  sendState(room);
}
