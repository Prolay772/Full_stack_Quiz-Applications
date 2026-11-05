import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 500 },
    options: {
      type: [{ type: String, trim: true, maxlength: 200 }],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 2 && v.length <= 6 && v.every(Boolean),
        message: "Provide between 2 and 6 non-empty options."
      }
    },
    correctIndex: { type: Number, required: true, min: 0 },
    category: { type: String, default: "General", trim: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

questionSchema.pre("validate", function (next) {
  if (this.correctIndex >= this.options.length) {
    this.invalidate("correctIndex", "Correct answer must match one of the options.");
  }
  next();
});

export default mongoose.model("Question", questionSchema);
