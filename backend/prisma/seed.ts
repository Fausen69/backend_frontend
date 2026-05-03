import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      name: 'NVIDIA GeForce RTX 4090',
      description: 'Флагманская видеокарта для игр и профессиональных задач. 24 ГБ GDDR6X.',
      price: 189990,
      image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
      category: 'Видеокарты',
      stock: 5
    },
    {
      name: 'AMD Ryzen 9 7950X',
      description: '16-ядерный процессор для максимальной производительности. Частота до 5.7 ГГц.',
      price: 54990,
      image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400',
      category: 'Процессоры',
      stock: 12
    },
    {
      name: 'Corsair Vengeance DDR5 32GB',
      description: 'Оперативная память нового поколения. Частота 5600 МГц, низкие тайминги.',
      price: 14990,
      image: 'https://images.unsplash.com/photo-1562976540-1502c214518f?w=400',
      category: 'Оперативная память',
      stock: 25
    },
    {
      name: 'Samsung 990 PRO 2TB NVMe',
      description: 'Сверхбыстрый SSD с интерфейсом PCIe 4.0. Скорость чтения до 7450 МБ/с.',
      price: 19990,
      image: 'https://images.unsplash.com/photo-1628147445445-8c9c3b2c6c9e?w=400',
      category: 'Накопители',
      stock: 18
    },
    {
      name: 'ASUS ROG Strix B650E-F',
      description: 'Материнская плата для процессоров AMD Ryzen 7000. Поддержка PCIe 5.0 и DDR5.',
      price: 24990,
      image: 'https://images.unsplash.com/photo-1555618568-98e2c8f5c8e7?w=400',
      category: 'Материнские платы',
      stock: 8
    },
    {
      name: 'be quiet! Dark Power 13 1000W',
      description: 'Блок питания с сертификатом 80+ Titanium. Модульная система кабелей.',
      price: 21990,
      image: 'https://images.unsplash.com/photo-1587202372775-e12f9c3f3d9b?w=400',
      category: 'Блоки питания',
      stock: 10
    },
    {
      name: 'NZXT H7 Flow',
      description: 'Просторный корпус с отличной циркуляцией воздуха. Поддержка ATX и E-ATX.',
      price: 12990,
      image: 'https://images.unsplash.com/photo-1587831990113-8c8f3f8a8b6e?w=400',
      category: 'Корпуса',
      stock: 7
    },
    {
      name: 'Arctic Liquid Freezer III 360',
      description: 'СЖО с радиатором 360 мм. Эффективное охлаждение для мощных процессоров.',
      price: 8990,
      image: 'https://images.unsplash.com/photo-1555618567-c8b5c8c5e8e8?w=400',
      category: 'Охлаждение',
      stock: 15
    }
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log('✅ Добавлено 8 товаров');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());