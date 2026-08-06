import { useEffect, useState } from 'react';
import { api } from '../socket.js';

export default function Home() {
  const [name, setName] = useState(() => localStorage.getItem('drawgame-name') || '');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('create');

  useEffect(() => {
    localStorage.setItem('drawgame-name', name);
  }, [name]);

  const submit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (mode === 'create') {
      api.createRoom(n);
    } else {
      api.joinRoom(code, n);
    }
  };

  return (
    <div className="screen">
      <h1 className="logo">✏️ Draw Game</h1>
      <p className="muted">A scribble-style drawing &amp; guessing game.</p>

      <div className="card">
        <div className="tabs">
          <button
            className={mode === 'create' ? 'tab active' : 'tab'}
            onClick={() => setMode('create')}
          >
            Create room
          </button>
          <button
            className={mode === 'join' ? 'tab active' : 'tab'}
            onClick={() => setMode('join')}
          >
            Join room
          </button>
        </div>

        <form onSubmit={submit} className="stack">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your nickname"
            maxLength={16}
            autoFocus
          />
          {mode === 'join' && (
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="Room code (e.g. AB12)"
              maxLength={4}
            />
          )}
          <button type="submit" className="primary" disabled={!name.trim()}>
            {mode === 'create' ? 'Create room' : 'Join room'}
          </button>
        </form>
      </div>

      <p className="muted small">
        2–8 players. Open this page in another tab to join yourself.
      </p>
    </div>
  );
}
