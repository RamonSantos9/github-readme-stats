/**
 * @fileoverview Servidor Express simplificado para desenvolvimento local.
 */
import "dotenv/config";
import statsCard from "./api/index.js";
import repoCard from "./api/pin.js";
import langCard from "./api/top-langs.js";
import wakatimeCard from "./api/wakatime.js";
import gistCard from "./api/gist.js";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const router = express.Router();

// Define as rotas espelhando a estrutura da Vercel
router.get("/", statsCard as any);
router.get("/pin", repoCard as any);
router.get("/top-langs", langCard as any);
router.get("/wakatime", wakatimeCard as any);
router.get("/gist", gistCard as any);

app.use((req: any, res: any, next: any) => {
  console.log(`[Express] Req: ${req.method} ${req.url}`);
  next();
});

app.use("/api", router);

// Rota de Playground para desenvolvimento
app.get("/playground", (req: Request, res: Response) => {
  const filePath = path.join(__dirname, "dev", "playground.html");
  console.log(`[Playground] Serving file: ${filePath}`);
  (res as any).sendFile(filePath);
});

const port = process.env.PORT || process.env.port || 9000;
app.listen(port, () => {
  console.log(`Servidor rodando em: http://localhost:${port}`);
  console.log(`Playground disponível em: http://localhost:${port}/playground`);
});
