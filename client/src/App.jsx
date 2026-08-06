import { useEffect, useState } from 'react';
import { socket, api } from './socket.js';
import Home from './components/Home.jsx';
import Lobby from './components/Lobby.jsx';
import Game from './components/Game.jsx';
import GameOver from './components/GameOver.jsx';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [room, setRoom] = useState(null);
  const [timer, setTimer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reveal, setReveal] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('roomState', (snap) => {
      setRoom(snap);
      setScreen(snap.state === 'lobby' ? 'lobby' : snap.state === 'gameover' ? 'gameover' : 'game');
    });
    socket.on('roundStart', (round) => {
      setScreen('game');
      setReveal(null);
      setMessages([]);
      setTimer(round.timeLeft);
    });
    socket.on('timer', ({ remaining }) => setTimer(remaining));
    socket.on('roundEnd', ({ word, reason, scores }) => setReveal({ word, reason, scores }));
    socket.on('newMessage', (m) => setMessages((prev) => [...prev, m]));
    socket.on('correctGuess', () => {});
    socket.on('yourGuessCorrect', ({ points }) => setError(''));
    socket.on('error', ({ message }) => setError(message));
    socket.on('connect', () => {
      setConnected(true);
      setError('');
    });
    socket.on('disconnect', () => setConnected(false));
    return () => socket.removeAllListeners();
  }, []);

  if (!connected) {
    return (
      <div className="screen">
        <h1>Draw Game</h1>
        <p className="muted">Reconnecting to server…</p>
      </div>
    );
  }

  return (
    <div className="app">
      {error && (
        <div className="error-banner" onClick={() => setError('')}>
          {error}
        </div>
      )}
      {screen === 'home' && <Home />}
      {screen === 'lobby' && <Lobby room={room} />}
      {screen === 'game' && (
        <Game
          room={room}
          timer={timer}
          messages={messages}
          reveal={reveal}
          onLeave={() => api.leave()}
        />
      )}
      {screen === 'gameover' && <GameOver room={room} />}
    </div>
  );
}
