import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("candidate");
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isAdmin = role === "admin";
  const creating = mode === "register" && !isAdmin;

  const pickRole = (r) => {
    setRole(r);
    setMode("login");
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = creating
        ? await register(form.name, form.email, form.password)
        : await login(form.email, form.password, role);
      navigate(user.role === "admin" ? "/admin" : "/play");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="brand brand-lg">
          <span className="brand-mark" aria-hidden="true">Q</span>
          Quiz Arena
        </div>
        <h1>Test your knowledge. Beat your friends.</h1>
        <p>
          Practice solo with questions from your admin&apos;s question bank, or open a room and race
          other candidates in real time.
        </p>
        <ul className="hero-points">
          <li><span className="dot dot-mint" /> Live multiplayer rooms with speed bonus scoring</li>
          <li><span className="dot dot-violet" /> Solo practice graded on the server</li>
          <li><span className="dot dot-amber" /> Admin panel to add, edit and remove questions</li>
        </ul>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="role-switch" role="tablist" aria-label="Login type">
            <button type="button" role="tab" aria-selected={!isAdmin} className={!isAdmin ? "on" : ""} onClick={() => pickRole("candidate")}>
              Candidate login
            </button>
            <button type="button" role="tab" aria-selected={isAdmin} className={isAdmin ? "on" : ""} onClick={() => pickRole("admin")}>
              Admin login
            </button>
          </div>

          <h2>{creating ? "Create your candidate account" : isAdmin ? "Welcome back, admin" : "Welcome back"}</h2>
          <p className="muted">
            {creating ? "It takes less than a minute." : isAdmin ? "Manage questions and see how candidates are doing." : "Log in to start a quiz or join a room."}
          </p>

          {creating && (
            <label className="field">
              <span>Full name</span>
              <input value={form.name} onChange={set("name")} placeholder="Alex Morgan" required autoComplete="name" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" required minLength={creating ? 6 : undefined} autoComplete={creating ? "new-password" : "current-password"} />
          </label>

          {error && <div className="alert" role="alert">{error}</div>}

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait..." : creating ? "Create account" : isAdmin ? "Log in as admin" : "Log in"}
          </button>

          {!isAdmin && (
            <p className="switch-line">
              {creating ? "Already have an account?" : "New here?"}{" "}
              <button type="button" className="link" onClick={() => { setMode(creating ? "login" : "register"); setError(""); }}>
                {creating ? "Log in" : "Create a candidate account"}
              </button>
            </p>
          )}
          {isAdmin && <p className="hint">Default admin: admin@quiz.com / admin123 (change it in your .env file).</p>}
        </form>
      </section>
    </div>
  );
}
