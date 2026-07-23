import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    console.log('🔐 AdminGuard - Usuario:', user);
    console.log('🔐 AdminGuard - Rol:', user?.role);

    if (!user) {
      console.error('❌ AdminGuard - No hay usuario autenticado');
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (user.role !== 'ADMIN') {
      console.error(`❌ AdminGuard - Rol no autorizado: ${user.role}`);
      throw new ForbiddenException('Solo los administradores pueden eliminar tickets');
    }

    console.log('✅ AdminGuard - Usuario ADMIN autorizado');
    return true;
  }
}
