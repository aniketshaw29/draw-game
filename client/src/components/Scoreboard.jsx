export default function Scoreboard({ players }) {
  return (
    <div className="scoreboard">
      <h3>Scoreboard</h3>
      <ol>
        {players.map((p) => (
          <li key={p.id} className={p.isDrawer ? 'drawing' : ''}>
            <span>
              {p.name}
              {p.isDrawer && <em> drawing…</em>}
            </span>
            <span className="score">{p.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
