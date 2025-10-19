const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const Todo = require("./models/Todo");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Helper Functions
const findAllTodosById = async (gameId) => {
  return await Todo.find({ gameId: Number(gameId) });
};

const deleteAllTodosById = async (gameId) => {
  return await Todo.deleteMany({ gameId: Number(gameId) });
};

// ✅ Routes
app.get("/", (req, res) => {
  res.send("✅ Todo API running successfully");
});

// Get all todos
app.get("/api/todos", async (req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
});

// Create new todo (requires gameId)
app.post("/api/todos", async (req, res) => {
  const { gameId, text } = req.body;
  if (!gameId || !text) {
    return res.status(400).json({ message: "gameId and text are required" });
  }
  const newTodo = new Todo({ gameId, text });
  await newTodo.save();
  res.status(201).json(newTodo);
});

// Delete single todo by ID
app.delete("/api/todos/id/:id", async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: "Todo deleted" });
});

// ✅ Get all todos for a specific gameId
app.get("/api/todos/game/:gameId", async (req, res) => {
  try {
    const todos = await findAllTodosById(req.params.gameId);
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching todos" });
  }
});

// ✅ Delete all todos for a specific gameId
app.delete("/api/todos/game/:gameId", async (req, res) => {
  try {
    const result = await deleteAllTodosById(req.params.gameId);
    res.json({ message: "Todos deleted", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: "Error deleting todos" });
  }
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
