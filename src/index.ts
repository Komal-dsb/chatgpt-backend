import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from "cors";
import { prisma } from "./lib/Prisma";

const app = express();
const port = 5000;
app.use(
  cors({
    origin: ["http://localhost:3000", "https://www.your-app.com"], // Array of all allowed origins
    credentials: true, // Required for cross-origin cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow necessary methods
    allowedHeaders: ["Content-Type", "Authorization", "User-Agent"], // Include necessary headers
    exposedHeaders: ["set-auth-token"], // Expose custom headers Better Auth might use
  })
);
app.get("/check", async (req, res) => {
  const result = await prisma.user.findMany({});
  console.log(result, "-----------------");
});

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

app.listen(port, () => {
  console.log(`Better Auth app listening on port ${port}`);
});
