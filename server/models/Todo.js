const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  gameId: { type: Number, required: true },
  text: { type: String, required: true },
});

module.exports = mongoose.model("Todo", todoSchema);
