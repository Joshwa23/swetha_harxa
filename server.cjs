var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var dataDir = import_path.default.join(__dirname, "data");
if (!import_fs.default.existsSync(dataDir)) {
  import_fs.default.mkdirSync(dataDir, { recursive: true });
}
var db = new import_better_sqlite3.default(import_path.default.join(dataDir, "leads.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    packageType TEXT NOT NULL,
    details TEXT,
    totalPrice INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/leads", (req, res) => {
    try {
      const { name, phone, email, packageType, details, totalPrice } = req.body;
      if (!name || !phone || !packageType) {
        return res.status(400).json({ error: "Name, phone, and packageType are required" });
      }
      const stmt = db.prepare(`
        INSERT INTO leads (name, phone, email, packageType, details, totalPrice)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        name,
        phone,
        email || null,
        packageType,
        details ? JSON.stringify(details) : null,
        totalPrice || null
      );
      res.status(201).json({ success: true, leadId: result.lastInsertRowid });
    } catch (error) {
      console.error("Error saving lead:", error);
      res.status(500).json({ error: "Failed to save lead" });
    }
  });
  app.post("/api/contact", (req, res) => {
    try {
      const { name, phone, email, message } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }
      const stmt = db.prepare(`
        INSERT INTO leads (name, phone, email, packageType, details)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        name,
        phone || null,
        email,
        "General Contact",
        message ? JSON.stringify({ message }) : null
      );
      console.log(`New contact request from ${name} (${email}). Message: ${message}`);
      res.status(201).json({ success: true, contactId: result.lastInsertRowid });
    } catch (error) {
      console.error("Error saving contact:", error);
      res.status(500).json({ error: "Failed to submit contact request" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
