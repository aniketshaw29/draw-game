import Canvas from './Canvas.jsx';
import Chat from './Chat.jsx';
import Scoreboard from './Scoreboard.jsx';

export default function Game({ room, timer, messages, reveal, onLeave }) {
  if (!room) return null;
  const round = room.round;
  const me = room.players.find((p) => p.id === room.selfId) || {};
  const isDrawer = round && round.drawerId === room.selfId;
  const drawerName =
    (room.players.find((p) => p.id === round.drawerId) || {}).name || '?';

  const wordShown = isDrawer || me.hasGuessed;

  return (
    <div className="game">
      <div className="topbar">
        <div className="room-code">Room {room.code}</div>
        <div className="round-info">
          {round && (
            <>
              Round {round.number} — {drawerName} is drawing
            </>
          )}
        </div>
        <div className="word-display">
          {wordShown && round.word
            ? round.word.toUpperCase()
            : round.wordMask || ''}
        </div>
        <div className={`timer ${timer <= 10 ? 'low' : ''}`}>
          {timer}s
        </div>
        <button className="tool-btn" onClick={onLeave}>
          Leave
        </button>
      </div>

      <div className="game-body">
        <div className="canvas-col">
          <Canvas canDraw={isDrawer} history={room.strokes} />
        </div>
        <div className="side-col">
          <Scoreboard players={room.players} />
          <Chat messages={messages} />
        </div>
      </div>

      {reveal && (
        <div className="reveal-overlay">
          <div className="reveal-card">
            <h2>The word was</h2>
            <p className="word-big">{reveal.word.toUpperCase()}</p>
            <p className="muted">Next round starts soon…</p>
          </div>
        </div>
      )}
    </div>
  );
}
