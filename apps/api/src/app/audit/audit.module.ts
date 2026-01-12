import { Module } from '@nestjs/common';
import { AuthModule } from '@org/auth';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [AuthModule],
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
