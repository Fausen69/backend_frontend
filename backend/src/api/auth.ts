import express, { Request, Response } from "express";
import prisma from "../../db";
import { hashPass, verifyPass } from "../utils/hashPass";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Заполните все поля" });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existingUser) {
      return res.status(400).json({ error: "Пользователь уже существует" });
    }

    const hashedPassword = await hashPass(password);
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword, role: "CLIENT" }  // ИСПРАВЛЕНО: добавлен data:
    });

    res.status(201).json({ message: "Пользователь создан", userId: user.id });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Ошибка регистрации" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Требуется email и пароль" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Неверные учётные данные" });
    }

    const isValid = await verifyPass(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Неверные учётные данные" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Вход выполнен",
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Ошибка входа" });
  }
});

router.post("/guest", (req: Request, res: Response) => {
  res.json({
    message: "Гостевой доступ",
    token: null,
    user: { id: null, email: null, username: "Гость", role: "GUEST" }
  });
});

export default router;