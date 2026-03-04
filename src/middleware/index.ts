import { AuthMiddleware } from './auth.middleware';
import { MaintenanceMiddleware } from './maintenance.middleware';

export const middlewares = [AuthMiddleware, MaintenanceMiddleware];
export const excludeRoutes = [];
export const allowRoutes = '*';
