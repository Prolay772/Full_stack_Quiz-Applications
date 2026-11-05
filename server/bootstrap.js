import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Question from "./models/Question.js";

export const sampleQuestions = [
  { text: "Which language runs natively in a web browser?", options: ["Python", "JavaScript", "C#", "Go"], correctIndex: 1, category: "Web", difficulty: "easy" },
  { text: "What does CSS stand for?", options: ["Computer Style Sheets", "Creative Style System", "Cascading Style Sheets", "Colorful Style Sheets"], correctIndex: 2, category: "Web", difficulty: "easy" },
  { text: "Which HTTP status code means 'Not Found'?", options: ["200", "301", "500", "404"], correctIndex: 3, category: "Web", difficulty: "easy" },
  { text: "In MongoDB, a row-like record is called a...", options: ["Tuple", "Document", "Node", "Entity"], correctIndex: 1, category: "Databases", difficulty: "easy" },
  { text: "Which React hook stores local component state?", options: ["useEffect", "useRef", "useState", "useMemo"], correctIndex: 2, category: "React", difficulty: "easy" },
  { text: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctIndex: 1, category: "Computer Science", difficulty: "medium" },
  { text: "Which protocol does Socket.IO prefer for real-time communication?", options: ["FTP", "SMTP", "WebSocket", "SSH"], correctIndex: 2, category: "Web", difficulty: "medium" },
  { text: "Which Node.js module system uses 'import' and 'export'?", options: ["CommonJS", "AMD", "ES Modules", "UMD"], correctIndex: 2, category: "Node.js", difficulty: "medium" },
  { text: "What does JWT stand for?", options: ["Java Web Token", "JSON Web Token", "JavaScript Web Tool", "Joint Web Transfer"], correctIndex: 1, category: "Security", difficulty: "easy" },
  { text: "Which data structure uses FIFO ordering?", options: ["Stack", "Tree", "Queue", "Heap"], correctIndex: 2, category: "Computer Science", difficulty: "medium" }
];

export async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@quiz.com").toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) return existing;
  const admin = await User.create({
    name: process.env.ADMIN_NAME || "Quiz Admin",
    email,
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10),
    role: "admin"
  });
  console.log(`Created admin account: ${email}`);
  return admin;
}

export async function ensureSampleQuestions() {
  if ((await Question.countDocuments()) === 0) {
    await Question.insertMany(sampleQuestions);
    console.log(`Added ${sampleQuestions.length} sample questions.`);
  }
}
