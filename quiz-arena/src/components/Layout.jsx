import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { closeSocket } from "../socket.js";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const signOut = () => {
    closeSocket();
    logout();
    navigate("/");
  };

  return (
    <div className="shell">
      <header className="topbar">
        <Link to={isAdmin ? "/admin" : "/play"} className="brand">
          <span className="brand-mark" aria-hidden="true">Q</span>
          Quiz Arena
        </Link>
        <nav className="nav">
          {isAdmin ? (
            <>
              <NavLink end to="/admin">Overview</NavLink>
              <NavLink to="/admin/questions">Questions</NavLink>
              <NavLink to="/admin/results">Results</NavLink>
            </>
          ) : (
            <>
              <NavLink end to="/play">Home</NavLink>
              <NavLink to="/play/multiplayer">Multiplayer</NavLink>
              <NavLink to="/play/leaderboard">Leaderboard</NavLink>
            </>
          )}
        </nav>
        <div className="who">
          <div className="avatar" aria-hidden="true">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="who-text">
            <strong>{user?.name}</strong>
            <span>{isAdmin ? "Admin" : "Candidate"}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>Log out</button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
