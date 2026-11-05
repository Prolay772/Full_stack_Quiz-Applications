import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const JWT_SECRET = () => process.env.JWT_SECRET || "dev-secret-change-me";

export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET(), { expiresIn: "7d" });
}

export function publicUser(u) {
  return { id: u._id, name: u.name, email: u.email, role: u.role };
}

export async function userFromToken(token) {
  const payload = jwt.verify(token, JWT_SECRET());
  return User.findById(payload.id);
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Please log in to continue." });
    const user = await userFromToken(token);
    if (!user) return res.status(401).json({ error: "Account not found. Please log in again." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Your session expired. Please log in again." });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: "You don't have access to this area." });
    next();
  };
}
