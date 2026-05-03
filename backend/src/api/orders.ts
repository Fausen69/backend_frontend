import express, { Request, Response, Router } from "express";
import prisma from "../../db";
import { OrderStatus, Prisma } from "@prisma/client";
import { authenticateToken, checkRole, AuthRequest } from "../middleware/auth";

const router: Router = express.Router();

const isValidOrderStatus = (status: string): status is OrderStatus =>
  Object.values(OrderStatus).includes(status as OrderStatus);

//Клиент
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { items, shippingAddress, comment } = req.body;
    if (!items?.length) return res.status(400).json({ error: "Заказ пуст" });
    if (!shippingAddress) return res.status(400).json({ error: "Нет адреса" });

    let total = 0;
    const validatedItems: { productId: number; quantity: number; price: number; name: string }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId, active: true } });
      if (!product) return res.status(404).json({ error: `Товар #${item.productId} не найден` });
      if (product.stock < item.quantity) return res.status(400).json({ error: `Мало товара: ${product.name}` });

      total += product.price.toNumber() * item.quantity;
      validatedItems.push({ productId: item.productId, quantity: item.quantity, price: product.price.toNumber(), name: product.name });
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.user!.id,
          status: OrderStatus.PENDING,
          total,
          items: validatedItems,
          shippingAddress,
          comment
        }
      });
      for (const item of validatedItems) {
        await tx.product.update({ 
          where: { id: item.productId }, 
          data: { stock: { decrement: item.quantity } } 
        });
      }
      return newOrder;
    });

    res.status(201).json({ message: "Заказ создан", orderId: order.id });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Ошибка заказа" });
  }
});

router.get("/my", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      select: { id: true, status: true, total: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: "Ошибка загрузки" });
  }
});
//Админ
router.get("/", authenticateToken, checkRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, page, limit } = req.query;
    const where: Prisma.OrderWhereInput = {};
    if (status && isValidOrderStatus(status as string)) {
      where.status = status as OrderStatus;
    }

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 20;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: { id: true, status: true, total: true, createdAt: true, user: { select: { email: true } } },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);
    res.json({ orders, pagination: { total, pages: Math.ceil(total / limitNum) } });
  } catch (e) {
    res.status(500).json({ error: "Ошибка загрузки заказов" });
  }
});

router.patch("/:id/status", authenticateToken, checkRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!isValidOrderStatus(status as string)) {
      return res.status(400).json({ error: "Неверный статус" });
    }

    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id as string) },
      data: { status: status as OrderStatus }
    });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: "Ошибка обновления" });
  }
});

router.delete("/:id", authenticateToken, checkRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id as string) },
      data: { status: OrderStatus.CANCELLED }
    });
    res.json({ message: "Заказ отменён" });
  } catch (e) {
    res.status(500).json({ error: "Ошибка отмены" });
  }
});

export default router;