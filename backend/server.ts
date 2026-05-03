import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { setupSocket } from './src/socket';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

import authRoutes from './src/api/auth';
import productRoutes from './src/api/products';
import orderRoutes from './src/api/orders';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

const httpServer = createServer(app);
setupSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});