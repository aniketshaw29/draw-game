import { io } from 'socket.io-client';

export const socket = io();

export const api = {
  createRoom: (name) => socket.emit('createRoom', { name }),
  joinRoom: (code, name) => socket.emit('joinRoom', { code, name }),
  startGame: () => socket.emit('startGame'),
  drawStroke: (stroke) => socket.emit('drawStroke', stroke),
  undo: () => socket.emit('undoStroke'),
  clear: () => socket.emit('clearCanvas'),
  message: (text) => socket.emit('message', { text }),
  playAgain: () => socket.emit('playAgain'),
  leave: () => socket.emit('leaveRoom'),
};
