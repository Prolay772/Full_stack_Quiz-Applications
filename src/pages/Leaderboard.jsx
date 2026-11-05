import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  useEffect(() => { api("/quiz/leaderboard").then(setRows).catch(() => setRows([])); }, []);

  return (
    <div className="page narrow">
      <div className="page-head"><div><h1>Leaderboard</h1><p className="muted">Total points across all games.</p></div></div>
      <section className="card">
        {!rows ? <div className="spinner" /> : rows.length === 0 ? (
          <p className="empty">Nobody has played yet. Be the first on the board.</p>
        ) : (
          <ol className="board">
            {rows.map((r, i) => (
              <li key={r._id} className={String(r._id) === String(user.id) ? "me" : ""}>
                <span className={`rank rank-${i + 1}`}>{i + 1}</span>
                <span className="board-name">{r.name}{String(r._id) === String(user.id) && " (you)"}</span>
                <span className="board-sub">{r.games} games &middot; best {r.best}</span>
                <strong>{r.total}</strong>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
