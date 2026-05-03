import express, { Request, Response, Router } from "express";
import prisma from "../../db";
import { authenticateToken, checkRole, AuthRequest } from "../middleware/auth";
import { Prisma } from "@prisma/client";

const router: Router = express.Router();

//Все
router.get("/", async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, price: true, image: true, category: true, description: true },
      take: 50,
      orderBy: { createdAt: "desc" }
    });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: "Ошибка загрузки товаров" });
  }
});

//Админ
router.get("/catalog", authenticateToken, checkRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, minPrice, maxPrice, sortBy, order, page, limit } = req.query;

    const where: Prisma.ProductWhereInput = { active: true };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    if (category) {
      where.category = category as string;
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    const sortField = (sortBy as string) || 'createdAt';
    const sortOrder = (order as 'asc' | 'desc') || 'desc';
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      prisma.product.findMany({ 
        where, 
        orderBy: { [sortField]: sortOrder }, 
        skip, 
        take: limitNum 
      }),
      prisma.product.count({ where })
    ]);

    res.json({ 
      products, 
      pagination: { 
        page: pageNum, 
        limit: limitNum, 
        total, 
        pages: Math.ceil(total / limitNum) 
      } 
    });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Ошибка фильтрации" });
  }
});

router.post("/", authenticateToken, checkRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, description, image, category, stock } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        image,
        category,
        stock: parseInt(stock) || 0
      }
    });
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Ошибка создания" });
  }
});

router.put("/:id", authenticateToken, checkRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, description, image, category, stock, active } = req.body;

    const product = await prisma.product.update({
      where: { id: parseInt(id as string) },
      data: {
        name,
        price: price ? parseFloat(price) : undefined,
        description,
        image,
        category,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        active: active !== undefined ? Boolean(active) : undefined
      }
    });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Ошибка обновления" });
  }
});

router.delete("/:id", authenticateToken, checkRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.update({
      where: { id: parseInt(req.params.id as string) },
      data: { active: false }
    });
    res.json({ message: "Товар деактивирован" });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Ошибка удаления" });
  }
});

export default router;