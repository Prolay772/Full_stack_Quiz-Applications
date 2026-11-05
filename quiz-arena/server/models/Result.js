import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: String,
    mode: { type: String, enum: ["solo", "multiplayer"], default: "solo" },
    category: { type: String, default: "All" },
    score: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    rank: Number,
    roomCode: String
  },
  { timestamps: true }
);

export default mongoose.model("Result", resultSchema);
