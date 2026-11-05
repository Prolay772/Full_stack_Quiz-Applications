import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function AdminResults() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api("/quiz/admin/results").then(setRows).catch(() => setRows([])); }, []);

  return (
    <div className="page">
      <div className="page-head"><div><h1>Candidate results</h1><p className="muted">The 200 most recent games.</p></div></div>
      <section className="card flush">
        {!rows ? <div className="spinner" /> : rows.length === 0 ? (
          <p className="empty">No results yet. They appear here after candidates finish a quiz.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Candidate</th><th>Mode</th><th>Category</th><th>Score</th><th>Correct</th><th>Date</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id}>
                    <td><strong>{r.userName}</strong></td>
                    <td><span className={`pill pill-${r.mode}`}>{r.mode}</span></td>
                    <td>{r.category}</td>
                    <td>{r.score}</td>
                    <td>{r.correct}/{r.total}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
