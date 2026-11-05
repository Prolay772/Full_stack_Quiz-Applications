import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken, publicUser, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "candidate"
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// role: "candidate" | "admin" - the login screen sends the role the person picked.
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    if (role && user.role !== role) {
      return res.status(403).json({
        error: user.role === "admin"
          ? "This is an admin account. Use Admin login."
          : "This is a candidate account. Use Candidate login."
      });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
