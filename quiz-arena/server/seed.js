import "dotenv/config";
import mongoose from "mongoose";
import Question from "./models/Question.js";
import { ensureAdmin, sampleQuestions } from "./bootstrap.js";

await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quiz-arena");
await ensureAdmin();
await Question.deleteMany({});
await Question.insertMany(sampleQuestions);
console.log(`Seeded ${sampleQuestions.length} sample questions.`);
await mongoose.disconnect();
