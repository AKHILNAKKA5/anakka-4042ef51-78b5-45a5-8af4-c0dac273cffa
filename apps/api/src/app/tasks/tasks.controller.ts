import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles, Role } from '@org/auth';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.ADMIN, Role.OWNER)
  async createTask(
    @Request() req: any,
    @Body() body: { title: string; description?: string; category?: string }
  ) {
    return this.tasksService.createTask(req.user.userId, body);
  }

  @Get()
  @Roles(Role.VIEWER)
  async listTasks(@Request() req: any) {
    return this.tasksService.listTasks(req.user.userId, req.user.role);
  }

  @Put(':id')
  @Roles(Role.VIEWER)
  async updateTask(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      category?: string;
      completed?: boolean;
    }
  ) {
    return this.tasksService.updateTask(id, req.user.userId, req.user.role, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.OWNER)
  async deleteTask(@Request() req: any, @Param('id') id: string) {
    await this.tasksService.deleteTask(id, req.user.userId, req.user.role);
    return { message: 'Task deleted successfully' };
  }
}
