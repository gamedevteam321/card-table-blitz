import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createRoom, getRooms, joinRoom } from '../controllers/room';

const router = Router();

// Room routes
router.post('/rooms', authenticateToken, createRoom);
router.get('/rooms', authenticateToken, getRooms);
router.post('/rooms/:roomId/join', authenticateToken, joinRoom);

export const setupRoutes = (app: Router) => {
  app.use('/api', router);
}; 