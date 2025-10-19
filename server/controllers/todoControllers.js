const Todo = require("../models/Todo");

// ✅ Find all todos for a specific gameId
const findAllTodosById = async (gameId) => {
  try {
    const todos = await Todo.find({ gameId });
    return todos;
  } catch (error) {
    console.error("❌ Error finding todos:", error);
    throw error;
  }
};

// ✅ Delete all todos for a specific gameId
const deleteAllTodosById = async (gameId) => {
  try {
    const result = await Todo.deleteMany({ gameId });
    return result; // { acknowledged: true, deletedCount: N }
  } catch (error) {
    console.error("❌ Error deleting todos:", error);
    throw error;
  }
};

module.exports = { findAllTodosById, deleteAllTodosById };
