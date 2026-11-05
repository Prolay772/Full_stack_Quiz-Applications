import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSocket } from "../socket.js";
import { useAuth } from "../auth.jsx";
import { useToast } from "../components/Toast.jsx";

function useCountdown(endsAt) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [endsAt]);
  return left;
}

export default function Room() {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [room, setRoom] = useState(null);
  const [picked, setPicked] = useState(null);
  const left = useCountdown(room?.endsAt);

  useEffect(() => {
    const socket = getSocket();
    const onState = (s) => setRoom(s);
    const sync = () =>
      socket.emit("room:sync", { code }, (res) => {
        if (res?.error) {
          toast(res.error, "error");
          navigate("/play/multiplayer");
        }
      });
    socket.on("room:state", onState);
    socket.on("connect", sync);
    if (socket.connected) sync();
    return () => {
      socket.off("room:state", onState);
      socket.off("connect", sync);
    };
  }, [code]);

  useEffect(() => { if (room?.phase === "question") setPicked(null); }, [room?.index, room?.phase === "question"]);

  const leave = () => {
    getSocket().emit("room:leave", { code });
    navigate("/play/multiplayer");
  };

  if (!room) return <div className="splash"><div className="spinner" /></div>;

  const isHost = room.hostId === user.id;
  const answer = (i) => {
    if (picked !== null) return;
    setPicked(i);
    getSocket().emit("room:answer", { code, choice: i });
  };

  const scoreboard = (
    <ol className="board compact">
      {room.players.map((p, i) => (
        <li key={p.id} className={p.id === user.id ? "me" : ""}>
          <span className={`rank rank-${i + 1}`}>{i + 1}</span>
          <span className="board-name">
            {p.name}{p.id === user.id && " (you)"}{!p.connected && " - away"}
            {room.phase === "question" && p.answered && <span className="tick" title="Answered"> ✓</span>}
          </span>
          {room.phase === "reveal" && room.gained[p.id] > 0 && <span className="gain">+{room.gained[p.id]}</span>}
          <strong>{p.score}</strong>
        </li>
      ))}
    </ol>
  );

  if (room.phase === "lobby") {
    return (
      <div className="page narrow">
        <section className="card center">
          <p className="muted">Share this code with your friends</p>
          <div className="room-code" aria-label={`Room code ${room.code}`}>{room.code}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(room.code); toast("Room code copied", "success"); }}>Copy code</button>
          <p className="muted">{room.total} questions &middot; {room.category}</p>
        </section>
        <section className="card">
          <h2>Players ({room.players.length})</h2>
          {scoreboard}
          <div className="row">
            {isHost ? (
              <button className="btn btn-primary" onClick={() => getSocket().emit("room:start", { code })}>Start game</button>
            ) : (
              <p className="muted grow">Waiting for the host to start...</p>
            )}
            <button className="btn btn-ghost" onClick={leave}>Leave room</button>
          </div>
        </section>
      </div>
    );
  }

  if (room.phase === "finished") {
    const me = room.players.findIndex((p) => p.id === user.id) + 1;
    return (
      <div className="page narrow">
        <section className="card center result-hero">
          <h1>{me === 1 ? "You won" : `You finished #${me}`}</h1>
          <p className="muted">Final standings. Your result has been saved.</p>
        </section>
        <section className="card">
          {scoreboard}
          <div className="row center-row">
            <Link to="/play/multiplayer" className="btn btn-primary">Play another room</Link>
            <Link to="/play" className="btn btn-ghost">Home</Link>
          </div>
        </section>
      </div>
    );
  }

  const revealing = room.phase === "reveal";
  const pct = revealing ? 0 : (left / room.secondsPerQuestion) * 100;
  return (
    <div className="page room-grid">
      <div>
        <div className="q-meta">
          <span>Question {room.index + 1} of {room.total}</span>
          <span className={`timer ${left <= 5 && !revealing ? "urgent" : ""}`}>{revealing ? "Results" : `${left}s`}</span>
        </div>
        <div className="progress timer-bar"><div style={{ width: `${pct}%` }} /></div>
        <section className="card q-card">
          <h2 className="q-text">{room.question.text}</h2>
          <div className="options">
            {room.question.options.map((o, i) => {
              let cls = "option";
              if (revealing) {
                if (i === room.correctIndex) cls += " correct";
                else if (room.picks[user.id] === i) cls += " wrong";
              } else if (picked === i) cls += " picked";
              return (
                <button key={i} className={cls} disabled={revealing || picked !== null} onClick={() => answer(i)}>
                  <span className="letter">{String.fromCharCode(65 + i)}</span>
                  {o}
                </button>
              );
            })}
          </div>
          {!revealing && picked !== null && <p className="muted center-text">Answer locked in. Waiting for the others...</p>}
        </section>
      </div>
      <aside className="card side">
        <h2>Scoreboard</h2>
        {scoreboard}
      </aside>
    </div>
  );
}
