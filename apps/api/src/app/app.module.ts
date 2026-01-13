import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthApiModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';
import { User, Organization, Task, Permission } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/api/.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbPath =
          configService.get<string>('DB_PATH') ||
          join(process.cwd(), configService.get<string>('DB_NAME', 'database.sqlite'));

        console.log(`[TypeORM] Using database at: ${dbPath}`);

        return {
          type: configService.get<string>('DB_TYPE', 'sqlite') as any,
          database: dbPath,
          entities: [User, Organization, Task, Permission],
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthApiModule,
    TasksModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
