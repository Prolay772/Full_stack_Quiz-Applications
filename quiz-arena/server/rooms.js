import Question from "./models/Question.js";
import Result from "./models/Result.js";
import { userFromToken } from "./middleware/auth.js";

const QUESTION_SECONDS = 15;
const REVEAL_SECONDS = 4;
const rooms = new Map();

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function ranking(room) {
  return [...room.players.values()]
    .map((p) => ({ id: p.id, name: p.name, score: p.score, correct: p.correct, connected: p.connected }))
    .sort((a, b) => b.score - a.score);
}

// Everything the clients are allowed to see. Correct answers stay hidden until reveal.
function snapshot(room) {
  const q = room.questions[room.index];
  const base = {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    category: room.category,
    total: room.questions.length,
    index: room.index,
    players: ranking(room).map((p) => ({ ...p, answered: room.players.get(p.id)?.answered ?? false })),
    secondsPerQuestion: QUESTION_SECONDS
  };
  if (room.phase === "question" || room.phase === "reveal") {
    base.question = { text: q.text, options: q.options, category: q.category };
    base.endsAt = room.endsAt;
  }
  if (room.phase === "reveal") {
    base.correctIndex = q.correctIndex;
    base.picks = Object.fromEntries([...room.players.values()].map((p) => [p.id, p.lastPick ?? null]));
    base.gained = Object.fromEntries([...room.players.values()].map((p) => [p.id, p.lastGain ?? 0]));
  }
  return base;
}

export function attachRooms(io) {
  const emit = (room) => io.to(room.code).emit("room:state", snapshot(room));

  io.use(async (socket, next) => {
    try {
      const user = await userFromToken(socket.handshake.auth?.token);
      if (!user) return next(new Error("unauthorized"));
      socket.data.user = { id: String(user._id), name: user.name, role: user.role };
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  function startQuestion(room) {
    room.phase = "question";
    room.endsAt = Date.now() + QUESTION_SECONDS * 1000;
    room.questionStartedAt = Date.now();
    room.players.forEach((p) => { p.answered = false; p.lastPick = null; p.lastGain = 0; });
    emit(room);
    clearTimeout(room.timer);
    room.timer = setTimeout(() => reveal(room), QUESTION_SECONDS * 1000);
  }

  function reveal(room) {
    if (room.phase !== "question") return;
    clearTimeout(room.timer);
    room.phase = "reveal";
    room.endsAt = Date.now() + REVEAL_SECONDS * 1000;
    emit(room);
    room.timer = setTimeout(() => next(room), REVEAL_SECONDS * 1000);
  }

  async function next(room) {
    clearTimeout(room.timer);
    if (room.index + 1 >= room.questions.length) return finish(room);
    room.index += 1;
    startQuestion(room);
  }

  async function finish(room) {
    room.phase = "finished";
    emit(room);
    const board = ranking(room);
    try {
      await Result.insertMany(
        board.map((p, i) => ({
          user: p.id, userName: p.name, mode: "multiplayer", category: room.category,
          score: p.score, correct: p.correct, total: room.questions.length, rank: i + 1, roomCode: room.code
        }))
      );
    } catch (e) {
      console.error("Could not save multiplayer results:", e.message);
    }
    setTimeout(() => rooms.delete(room.code), 10 * 60 * 1000);
  }

  io.on("connection", (socket) => {
    const me = socket.data.user;
    let currentCode = null;

    const join = (room) => {
      currentCode = room.code;
      socket.join(room.code);
      const existing = room.players.get(me.id);
      room.players.set(me.id, existing
        ? { ...existing, connected: true, socketId: socket.id }
        : { id: me.id, name: me.name, score: 0, correct: 0, answered: false, connected: true, socketId: socket.id });
      emit(room);
    };

    socket.on("room:create", async ({ category = "all", count = 8 } = {}, ack) => {
      if (me.role !== "candidate") return ack?.({ error: "Only candidates can host a room." });
      const match = category && category !== "all" ? { category } : {};
      const questions = await Question.aggregate([
        { $match: match }, { $sample: { size: Math.min(Math.max(parseInt(count) || 8, 3), 30) } }
      ]);
      if (!questions.length) return ack?.({ error: "No questions found for that category." });
      const room = {
        code: makeCode(), hostId: me.id, phase: "lobby", category: category === "all" ? "All" : category,
        questions, index: 0, players: new Map(), timer: null, endsAt: 0
      };
      rooms.set(room.code, room);
      join(room);
      ack?.({ code: room.code });
    });

    socket.on("room:join", ({ code } = {}, ack) => {
      const room = rooms.get(String(code || "").toUpperCase().trim());
      if (!room) return ack?.({ error: "Room not found. Check the code and try again." });
      if (me.role !== "candidate") return ack?.({ error: "Only candidates can join a room." });
      if (room.phase !== "lobby" && !room.players.has(me.id)) {
        return ack?.({ error: "That game has already started." });
      }
      join(room);
      ack?.({ code: room.code });
    });

    socket.on("room:sync", ({ code } = {}, ack) => {
      const room = rooms.get(String(code || "").toUpperCase());
      if (!room || !room.players.has(me.id)) return ack?.({ error: "Room is no longer available." });
      join(room);
      ack?.({ code: room.code });
    });

    socket.on("room:start", ({ code } = {}) => {
      const room = rooms.get(code);
      if (!room || room.hostId !== me.id || room.phase !== "lobby") return;
      startQuestion(room);
    });

    socket.on("room:answer", ({ code, choice } = {}) => {
      const room = rooms.get(code);
      const player = room?.players.get(me.id);
      if (!room || !player || room.phase !== "question" || player.answered) return;
      const q = room.questions[room.index];
      player.answered = true;
      player.lastPick = choice;
      if (choice === q.correctIndex) {
        const remaining = Math.max(0, room.endsAt - Date.now()) / (QUESTION_SECONDS * 1000);
        player.lastGain = 500 + Math.round(500 * remaining);
        player.score += player.lastGain;
        player.correct += 1;
      }
      emit(room);
      if ([...room.players.values()].every((p) => p.answered || !p.connected)) reveal(room);
    });

    socket.on("room:leave", ({ code } = {}) => {
      const room = rooms.get(code);
      socket.leave(code);
      if (!room) return;
      if (room.phase === "lobby") room.players.delete(me.id);
      else if (room.players.get(me.id)) room.players.get(me.id).connected = false;
      cleanup(room);
    });

    socket.on("disconnect", () => {
      const room = rooms.get(currentCode);
      if (!room) return;
      const p = room.players.get(me.id);
      if (p && p.socketId === socket.id) p.connected = false;
      cleanup(room);
    });

    function cleanup(room) {
      const anyone = [...room.players.values()].some((p) => p.connected);
      if (!anyone) {
        clearTimeout(room.timer);
        rooms.delete(room.code);
        return;
      }
      if (room.hostId === me.id && room.phase === "lobby") {
        room.hostId = [...room.players.values()].find((p) => p.connected).id;
      }
      emit(room);
      if (room.phase === "question" && [...room.players.values()].every((p) => p.answered || !p.connected)) reveal(room);
    }
  });
}
