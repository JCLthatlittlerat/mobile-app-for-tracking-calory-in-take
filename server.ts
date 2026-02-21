import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("calories.db");
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_me";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    age INTEGER,
    gender TEXT,
    weight REAL,
    height REAL,
    activity_level TEXT,
    target_calories INTEGER
  );

  CREATE TABLE IF NOT EXISTS calorie_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT,
    food_name TEXT,
    calories INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const PORT = 3000;

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      const info = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, hashedPassword, name);
      const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET);
      res.json({ token, user: { id: info.lastInsertRowid, email, name } });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email, name: user.name, age: user.age, gender: user.gender, weight: user.weight, height: user.height, activity_level: user.activity_level, target_calories: user.target_calories } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/user/profile", authenticateToken, (req: any, res) => {
    const user = db.prepare("SELECT id, email, name, age, gender, weight, height, activity_level, target_calories FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  app.put("/api/user/profile", authenticateToken, (req: any, res) => {
    const { age, gender, weight, height, activity_level, target_calories } = req.body;
    db.prepare("UPDATE users SET age = ?, gender = ?, weight = ?, height = ?, activity_level = ?, target_calories = ? WHERE id = ?")
      .run(age, gender, weight, height, activity_level, target_calories, req.user.id);
    res.json({ success: true });
  });

  app.get("/api/logs", authenticateToken, (req: any, res) => {
    const logs = db.prepare("SELECT * FROM calorie_logs WHERE user_id = ? ORDER BY date DESC").all(req.user.id);
    res.json(logs);
  });

  app.post("/api/logs", authenticateToken, (req: any, res) => {
    const { food_name, calories, date } = req.body;
    db.prepare("INSERT INTO calorie_logs (user_id, food_name, calories, date) VALUES (?, ?, ?, ?)")
      .run(req.user.id, food_name, calories, date || new Date().toISOString().split('T')[0]);
    res.json({ success: true });
  });

  app.delete("/api/logs/:id", authenticateToken, (req: any, res) => {
    db.prepare("DELETE FROM calorie_logs WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
