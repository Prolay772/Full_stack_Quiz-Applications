import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function CandidateHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [count, setCount] = useState(10);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api("/questions/categories").then(setCategories).catch(() => {});
    api("/quiz/results/me").then(setHistory).catch(() => {});
  }, []);

  const totalQuestions = categories.reduce((n, c) => n + c.count, 0);
  const best = history.reduce((m, r) => Math.max(m, r.score), 0);

  const start = () => navigate(`/play/quiz?category=${encodeURIComponent(category)}&count=${count}`);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Hi {user.name.split(" ")[0]}, ready to play?</h1>
          <p className="muted">{totalQuestions} questions available across {categories.length} categories.</p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card card-feature">
          <h2>Solo quiz</h2>
          <p className="muted">Pick a topic and answer at your own pace. Your score is saved to your history.</p>
          <div className="row">
            <label className="field grow">
              <span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Questions</span>
              <select value={count} onChange={(e) => setCount(+e.target.value)}>
                {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <button className="btn btn-primary" onClick={start} disabled={!totalQuestions}>Start quiz</button>
        </section>

        <section className="card">
          <h2>Play with others</h2>
          <p className="muted">Host a room and share the code, or join a friend&apos;s room. Faster correct answers earn more points.</p>
          <Link to="/play/multiplayer" className="btn btn-accent">Open multiplayer</Link>
          <div className="stats-mini">
            <div><strong>{history.length}</strong><span>Games played</span></div>
            <div><strong>{best}</strong><span>Best score</span></div>
          </div>
        </section>
      </div>

      <section className="card">
        <h2>Your recent games</h2>
        {history.length === 0 ? (
          <p className="empty">No games yet. Start a solo quiz to see your results here.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Mode</th><th>Category</th><th>Score</th><th>Correct</th></tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r._id}>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><span className={`pill pill-${r.mode}`}>{r.mode}</span></td>
                    <td>{r.category}</td>
                    <td><strong>{r.score}</strong></td>
                    <td>{r.correct}/{r.total}</td>
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
