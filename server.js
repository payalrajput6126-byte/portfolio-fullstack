require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/portfolio";

app.use(cors());
app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    tech: [String],
    link: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const Project = mongoose.model("Project", projectSchema);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Portfolio API is running" });
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email and message are all required." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }
    const saved = await Message.create({ name, email, message });
    res.status(201).json({ success: true, id: saved._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again later." });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch messages." });
  }
});

app.patch("/api/messages/:id/read", async (req, res) => {
  try {
    const updated = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!updated) return res.status(404).json({ error: "Message not found." });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Could not update message." });
  }
});

app.delete("/api/messages/:id", async (req, res) => {
  try {
    const deleted = await Message.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Message not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete message." });
  }
});

app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch projects." });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: "Could not create project." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
