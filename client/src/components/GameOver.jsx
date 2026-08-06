import { api } from '../socket.js';

export default function GameOver({ room }) {
  if (!room) return null;
  const isHost = room.selfId === room.hostId;
  const [winner, ...rest] = room.players;

  return (
    <div className="screen">
      <div className="card gameover">
        <h2>Game over!</h2>
        {winner && (
          <p className="winner">
            🏆 <strong>{winner.name}</strong> wins with {winner.score} points!
          </p>
        )}
        <ol className="player-list">
          {room.players.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <span className="score">{p.score}</span>
            </li>
          ))}
        </ol>
        {isHost ? (
          <button className="primary" onClick={() => api.playAgain()}>
            Play again
          </button>
        ) : (
          <p className="muted">Waiting for the host to start a new game…</p>
        )}
      </div>
    </div>
  );
}
