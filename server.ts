import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("remote_connect.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS dispositivos (
    id TEXT PRIMARY KEY,
    nome TEXT,
    ultimo_acesso DATETIME,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispositivo_origem TEXT,
    dispositivo_destino TEXT,
    inicio DATETIME,
    fim DATETIME,
    ip_origem TEXT
  );

  CREATE TABLE IF NOT EXISTS transferencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessao_id INTEGER,
    nome_arquivo TEXT,
    tamanho INTEGER,
    status TEXT,
    data_envio DATETIME
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/devices", (req, res) => {
    const devices = db.prepare("SELECT * FROM dispositivos ORDER BY ultimo_acesso DESC").all();
    res.json(devices);
  });

  app.post("/api/devices", (req, res) => {
    const { id, nome } = req.body;
    db.prepare("INSERT OR REPLACE INTO dispositivos (id, nome, ultimo_acesso, status) VALUES (?, ?, datetime('now'), 'online')").run(id, nome);
    res.json({ success: true });
  });

  // Socket.io for Signaling
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (deviceId) => {
      socket.join(deviceId);
      console.log(`Socket ${socket.id} joined device room: ${deviceId}`);
    });

    socket.on("offer", ({ to, offer }) => {
      socket.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
      socket.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Explicitly serve index.html for SPA in dev mode
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import("fs");
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
