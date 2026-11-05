import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api("/quiz/admin/stats").then(setStats).catch(() => {}); }, []);

  if (!stats) return <div className="splash"><div className="spinner" /></div>;
  const max = Math.max(1, ...stats.byCategory.map((c) => c.count));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Admin overview</h1><p className="muted">A quick look at your question bank and candidate activity.</p></div>
        <Link to="/admin/questions" className="btn btn-primary">Manage questions</Link>
      </div>

      <div className="stat-grid">
        <div className="stat"><span>Questions</span><strong>{stats.questions}</strong></div>
        <div className="stat"><span>Candidates</span><strong>{stats.candidates}</strong></div>
        <div className="stat"><span>Games played</span><strong>{stats.results}</strong></div>
        <div className="stat"><span>Average score</span><strong>{stats.avgPercent}%</strong></div>
      </div>

      <section className="card">
        <h2>Questions by category</h2>
        {stats.byCategory.length === 0 ? (
          <p className="empty">No questions yet. Add your first one to get started.</p>
        ) : (
          <div className="bars">
            {stats.byCategory.map((c) => (
              <div key={c._id} className="bar-row">
                <span>{c._id}</span>
                <div className="bar"><div style={{ width: `${(c.count / max) * 100}%` }} /></div>
                <strong>{c.count}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
