import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { TicketsModule } from './tickets/tickets.module';
import { AuthModule } from './auth/auth.module';
import { MetricsModule } from './metrics/metrics.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, TicketsModule, AuthModule, MetricsModule, UsersModule ],
})
export class AppModule {}
