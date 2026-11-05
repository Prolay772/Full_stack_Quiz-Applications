import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import CandidateHome from "./pages/CandidateHome.jsx";
import Quiz from "./pages/Quiz.jsx";
import Multiplayer from "./pages/Multiplayer.jsx";
import Room from "./pages/Room.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminQuestions from "./pages/AdminQuestions.jsx";
import AdminResults from "./pages/AdminResults.jsx";

function Guard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/play"} replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash"><div className="spinner" /></div>;

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/play"} replace /> : <Login />}
      />
      <Route path="/play" element={<Guard role="candidate"><CandidateHome /></Guard>} />
      <Route path="/play/quiz" element={<Guard role="candidate"><Quiz /></Guard>} />
      <Route path="/play/multiplayer" element={<Guard role="candidate"><Multiplayer /></Guard>} />
      <Route path="/play/room/:code" element={<Guard role="candidate"><Room /></Guard>} />
      <Route path="/play/leaderboard" element={<Guard role="candidate"><Leaderboard /></Guard>} />
      <Route path="/admin" element={<Guard role="admin"><AdminDashboard /></Guard>} />
      <Route path="/admin/questions" element={<Guard role="admin"><AdminQuestions /></Guard>} />
      <Route path="/admin/results" element={<Guard role="admin"><AdminResults /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
