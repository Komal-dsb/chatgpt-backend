import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from "cors";
import { prisma } from "./lib/Prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const app = express();
const port = 5000;
app.use(
  cors({
    origin: ["http://localhost:3000", "https://www.your-app.com"], // Array of all allowed origins
    credentials: true, // Required for cross-origin cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow necessary methods
    allowedHeaders: ["Content-Type", "Authorization", "User-Agent"], // Include necessary headers
    exposedHeaders: ["set-auth-token"], // Expose custom headers Better Auth might use
  }),
);

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

app.get("/chats", async (req, res) => {
  const id = req?.query?.userId;

  if (!id || typeof id !== "string") {
    return res.json({ value: "Send UserId" });
  }

  const chats = await prisma.chats.findMany({
    where: {
      userId: id,
    },
  });

  res.json({ value: chats });
});

app.post("/ai", async (req, res) => {
  const { message, userId } = req.body;
  console.log(req.body)
  if (!message && !userId) {
    return res.json({ value: "Send message and UserId" });
  }

  // add in chat table
  const chatList = await prisma.chats.create({
    data: {
      userId: userId,
      title: message,
    },
  });

  // add in message table
  if (!message) {
    return res.json({ value: "Send message (Question)" });
  }
  const messages = await prisma.messages.create({
    data: {
      message: message,
      senderType: "User",
      userId: userId,
      chatId: chatList.id,
    },
  });

  // response add in message
  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: message,
  });

  const aiResponse = await prisma.messages.create({
    data: {
      message: text,
      senderType: "AI",
      userId: userId,
      chatId: chatList.id,
    },
  });

  res.json({ value: text });
});

app.listen(port, () => {
  console.log(`Better Auth app listening on port ${port}`);
});
