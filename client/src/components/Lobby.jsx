import { api } from '../socket.js';

export default function Lobby({ room }) {
  if (!room) return null;
  const me = room.players.find((p) => p.id === room.selfId);
  const isHost = room.selfId === room.hostId;
  const canStart = room.players.length >= 2 && room.players.length <= 8;

  return (
    <div className="screen">
      <div className="card lobby">
        <div className="lobby-head">
          <div>
            <h2>Room {room.code}</h2>
            <p className="muted small">
              Share this code with friends to play.
            </p>
          </div>
          <span className="badge">
            {room.players.length}/8 players
          </span>
        </div>

        <ul className="player-list">
          {room.players.map((p) => (
            <li key={p.id} className={p.id === room.selfId ? 'self' : ''}>
              <span>
                {p.id === room.hostId && <span title="host">👑 </span>}
                {p.name} {p.id === room.selfId && <em>(you)</em>}
              </span>
              <span className="score">{p.score}</span>
            </li>
          ))}
        </ul>

        {isHost ? (
          <button
            className="primary"
            disabled={!canStart}
            onClick={() => api.startGame()}
          >
            Start game
          </button>
        ) : (
          <p className="muted">Waiting for the host to start…</p>
        )}

        <button className="ghost" onClick={() => api.leave()}>
          Leave room
        </button>
      </div>
    </div>
  );
}
