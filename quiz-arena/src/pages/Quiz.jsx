import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";

export default function Quiz() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const category = params.get("category") || "all";
  const count = params.get("count") || 10;

  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    api(`/quiz/start?category=${encodeURIComponent(category)}&count=${count}`)
      .then((q) => { setQuestions(q); startedAt.current = Date.now(); })
      .catch((e) => setError(e.message));
  }, [category, count]);

  const submit = async (finalAnswers) => {
    try {
      const timeTaken = Math.round((Date.now() - startedAt.current) / 1000);
      setResult(await api("/quiz/submit", { method: "POST", body: { answers: finalAnswers, timeTaken, category: category === "all" ? "All" : category } }));
    } catch (e) {
      setError(e.message);
    }
  };

  const next = () => {
    const q = questions[index];
    const updated = [...answers, { questionId: q.id, selected }];
    setAnswers(updated);
    setSelected(null);
    if (index + 1 >= questions.length) submit(updated);
    else setIndex(index + 1);
  };

  if (error) {
    return (
      <div className="page narrow">
        <div className="card center">
          <h2>We couldn&apos;t load this quiz</h2>
          <p className="muted">{error}</p>
          <Link to="/play" className="btn btn-primary">Back to home</Link>
        </div>
      </div>
    );
  }
  if (!questions) return <div className="splash"><div className="spinner" /></div>;

  if (result) {
    const pct = Math.round((result.correct / result.total) * 100);
    return (
      <div className="page narrow">
        <section className="card center result-hero">
          <div className="ring" style={{ "--pct": pct }}><span>{pct}%</span></div>
          <h1>{pct >= 80 ? "Outstanding work" : pct >= 50 ? "Nice effort" : "Keep practicing"}</h1>
          <p className="muted">You answered {result.correct} of {result.total} correctly and scored {result.score} points.</p>
          <div className="row center-row">
            <button className="btn btn-primary" onClick={() => navigate(0)}>Play again</button>
            <Link to="/play" className="btn btn-ghost">Back to home</Link>
          </div>
        </section>
        <section className="card">
          <h2>Review your answers</h2>
          <div className="review">
            {result.review.map((r, i) => (
              <div key={r.id} className={`review-item ${r.isCorrect ? "ok" : "bad"}`}>
                <div className="review-q"><span>{i + 1}.</span> {r.text}</div>
                <div className="review-a">
                  Your answer: <strong>{r.selected != null ? r.options[r.selected] : "No answer"}</strong>
                  {!r.isCorrect && <> &middot; Correct: <strong>{r.options[r.correctIndex]}</strong></>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const q = questions[index];
  return (
    <div className="page narrow">
      <div className="progress"><div style={{ width: `${(index / questions.length) * 100}%` }} /></div>
      <div className="q-meta">
        <span>Question {index + 1} of {questions.length}</span>
        <span className="pill">{q.category}</span>
      </div>
      <section className="card q-card">
        <h2 className="q-text">{q.text}</h2>
        <div className="options">
          {q.options.map((o, i) => (
            <button key={i} className={`option ${selected === i ? "picked" : ""}`} onClick={() => setSelected(i)}>
              <span className="letter">{String.fromCharCode(65 + i)}</span>
              {o}
            </button>
          ))}
        </div>
        <div className="q-actions">
          <button className="btn btn-primary" disabled={selected === null} onClick={next}>
            {index + 1 === questions.length ? "Finish quiz" : "Next question"}
          </button>
        </div>
      </section>
    </div>
  );
}
