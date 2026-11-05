import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { getSocket } from "../socket.js";
import { useToast } from "../components/Toast.jsx";

export default function Multiplayer() {
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [count, setCount] = useState(8);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api("/questions/categories").then(setCategories).catch(() => {}); }, []);

  const go = (event, payload) => {
    setBusy(true);
    getSocket().emit(event, payload, (res) => {
      setBusy(false);
      if (res?.error) return toast(res.error, "error");
      navigate(`/play/room/${res.code}`);
    });
  };

  return (
    <div className="page">
      <div className="page-head"><div><h1>Multiplayer</h1><p className="muted">Everyone answers at the same time. Faster correct answers earn more points.</p></div></div>
      <div className="grid-2">
        <section className="card">
          <h2>Host a room</h2>
          <p className="muted">You choose the topic, then share the room code.</p>
          <div className="row">
            <label className="field grow">
              <span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories</option>
                {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Questions</span>
              <select value={count} onChange={(e) => setCount(+e.target.value)}>
                {[5, 8, 10, 15].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <button className="btn btn-primary" disabled={busy} onClick={() => go("room:create", { category, count })}>Create room</button>
        </section>
        <section className="card">
          <h2>Join a room</h2>
          <p className="muted">Enter the 5-character code your host shared.</p>
          <label className="field">
            <span>Room code</span>
            <input className="code-input" value={code} maxLength={5} placeholder="ABC12" onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </label>
          <button className="btn btn-accent" disabled={busy || code.length < 5} onClick={() => go("room:join", { code })}>Join room</button>
        </section>
      </div>
    </div>
  );
}
