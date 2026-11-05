import { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";
import { useToast } from "../components/Toast.jsx";

const blank = { text: "", options: ["", "", "", ""], correctIndex: 0, category: "General", difficulty: "medium" };

function QuestionModal({ initial, onClose, onSaved }) {
  const toast = useToast();
  const [q, setQ] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const editing = !!initial._id;

  const setOption = (i, v) => setQ({ ...q, options: q.options.map((o, idx) => (idx === i ? v : o)) });
  const addOption = () => q.options.length < 6 && setQ({ ...q, options: [...q.options, ""] });
  const removeOption = (i) => {
    if (q.options.length <= 2) return;
    const options = q.options.filter((_, idx) => idx !== i);
    let correctIndex = q.correctIndex;
    if (i === correctIndex) correctIndex = 0;
    else if (i < correctIndex) correctIndex -= 1;
    setQ({ ...q, options, correctIndex });
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = { text: q.text, options: q.options, correctIndex: q.correctIndex, category: q.category, difficulty: q.difficulty };
      if (editing) await api(`/questions/${initial._id}`, { method: "PUT", body });
      else await api("/questions", { method: "POST", body });
      toast(editing ? "Question updated" : "Question added", "success");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={save} role="dialog" aria-modal="true" aria-label={editing ? "Edit question" : "Add question"}>
        <div className="modal-head">
          <h2>{editing ? "Edit question" : "Add question"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <label className="field">
          <span>Question</span>
          <textarea rows={3} value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} placeholder="What is the capital of France?" required />
        </label>

        <div className="field">
          <span>Answer options (select the correct one)</span>
          <div className="opt-list">
            {q.options.map((o, i) => (
              <div key={i} className="opt-row">
                <input type="radio" name="correct" checked={q.correctIndex === i} onChange={() => setQ({ ...q, correctIndex: i })} aria-label={`Option ${i + 1} is correct`} />
                <input value={o} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${i + 1}`} required />
                <button type="button" className="icon-btn" onClick={() => removeOption(i)} disabled={q.options.length <= 2} aria-label={`Remove option ${i + 1}`}>×</button>
              </div>
            ))}
          </div>
          {q.options.length < 6 && <button type="button" className="btn btn-ghost btn-sm" onClick={addOption}>Add option</button>}
        </div>

        <div className="row">
          <label className="field grow">
            <span>Category</span>
            <input value={q.category} onChange={(e) => setQ({ ...q, category: e.target.value })} placeholder="General" required />
          </label>
          <label className="field">
            <span>Difficulty</span>
            <select value={q.difficulty} onChange={(e) => setQ({ ...q, difficulty: e.target.value })}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>

        {error && <div className="alert" role="alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Add question"}</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminQuestions() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [filters, setFilters] = useState({ search: "", category: "all", difficulty: "all" });
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams(filters).toString();
    setItems(await api(`/questions?${qs}`));
    api("/questions/categories").then(setCategories).catch(() => {});
  }, [filters]);

  useEffect(() => {
    const id = setTimeout(() => load().catch((e) => toast(e.message, "error")), 200);
    return () => clearTimeout(id);
  }, [load]);

  const remove = async () => {
    try {
      await api(`/questions/${confirm._id}`, { method: "DELETE" });
      toast("Question deleted", "success");
      setConfirm(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Question bank</h1><p className="muted">Add, edit and remove the questions candidates will see.</p></div>
        <button className="btn btn-primary" onClick={() => setModal(blank)}>Add question</button>
      </div>

      <div className="toolbar">
        <input className="search" placeholder="Search questions" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
          <option value="all">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <section className="card flush">
        {!items ? <div className="spinner" /> : items.length === 0 ? (
          <p className="empty">No questions match. Try different filters or add a new question.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Question</th><th>Correct answer</th><th>Category</th><th>Level</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {items.map((q) => (
                  <tr key={q._id}>
                    <td className="q-cell">{q.text}</td>
                    <td>{q.options[q.correctIndex]}</td>
                    <td>{q.category}</td>
                    <td><span className={`pill pill-${q.difficulty}`}>{q.difficulty}</span></td>
                    <td className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(q)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(q)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && <QuestionModal initial={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}

      {confirm && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal small" role="alertdialog" aria-modal="true">
            <h2>Delete this question?</h2>
            <p className="muted">&ldquo;{confirm.text}&rdquo; will be removed permanently.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Keep question</button>
              <button className="btn btn-danger" onClick={remove}>Delete question</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
