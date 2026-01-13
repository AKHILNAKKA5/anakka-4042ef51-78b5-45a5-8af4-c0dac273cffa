import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Role } from '@org/auth';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private auditService: AuditService
  ) {}

  async createTask(
    userId: string,
    data: { title: string; description?: string; category?: string }
  ): Promise<Task> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Only OWNER and ADMIN can create tasks
    if (user.role !== Role.OWNER && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only OWNER and ADMIN can create tasks');
    }

    const task = this.taskRepository.create({
      title: data.title,
      description: data.description || null,
      category: data.category || null,
      completed: false,
      owner: user,
      organization: user.organization,
    });

    const savedTask = await this.taskRepository.save(task);

    this.auditService.log(userId, 'CREATE_TASK', {
      taskId: savedTask.id,
      title: savedTask.title,
    });

    return savedTask;
  }

  async listTasks(userId: string, userRole: Role): Promise<Task[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user || !user.organization) {
      throw new ForbiddenException('User or organization not found');
    }

    let tasks: Task[] = [];

    if (userRole === Role.VIEWER) {
      // VIEWER: Can see only own tasks
      tasks = await this.taskRepository.find({
        where: { owner: { id: userId } },
        relations: ['owner', 'organization'],
      });
    } else if (userRole === Role.ADMIN) {
      // ADMIN: Can see all tasks in their organization
      tasks = await this.taskRepository.find({
        where: { organization: { id: user.organization.id } },
        relations: ['owner', 'organization'],
      });
    } else if (userRole === Role.OWNER) {
      // OWNER: Can see tasks in their organization and child organizations
      const childOrgs = await this.organizationRepository.find({
        where: { parent: { id: user.organization.id } },
      });

      const orgIds = [
        user.organization.id,
        ...childOrgs.map((org) => org.id),
      ];

      tasks = await this.taskRepository
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.owner', 'owner')
        .leftJoinAndSelect('task.organization', 'organization')
        .where('task.organization.id IN (:...orgIds)', { orgIds })
        .getMany();
    }

    this.auditService.log(userId, 'READ_TASKS', { count: tasks.length });

    return tasks;
  }

  async updateTask(
    taskId: string,
    userId: string,
    userRole: Role,
    data: { title?: string; description?: string; category?: string; completed?: boolean }
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['owner', 'organization', 'organization.parent'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user || !user.organization) {
      throw new ForbiddenException('User or organization not found');
    }

    // Check authorization
    if (userRole === Role.VIEWER) {
      // VIEWER: Can update only own tasks
      if (task.owner.id !== userId) {
        throw new ForbiddenException('You can only update your own tasks');
      }
    } else if (userRole === Role.ADMIN) {
      // ADMIN: Can update any task in own organization
      if (task.organization.id !== user.organization.id) {
        throw new ForbiddenException(
          'You can only update tasks in your organization'
        );
      }
    } else if (userRole === Role.OWNER) {
      // OWNER: Can update tasks in org or child org
      const isOwnOrg = task.organization.id === user.organization.id;
      const isChildOrg =
        task.organization.parent?.id === user.organization.id;

      if (!isOwnOrg && !isChildOrg) {
        throw new ForbiddenException(
          'You can only update tasks in your organization or child organizations'
        );
      }
    }

    // Update task
    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.category !== undefined) task.category = data.category;
    if (data.completed !== undefined) task.completed = data.completed;

    const updatedTask = await this.taskRepository.save(task);

    this.auditService.log(userId, 'UPDATE_TASK', {
      taskId: updatedTask.id,
      changes: data,
    });

    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string, userRole: Role): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['owner', 'organization', 'organization.parent'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user || !user.organization) {
      throw new ForbiddenException('User or organization not found');
    }

    // Only OWNER and ADMIN can delete
    if (userRole === Role.VIEWER) {
      throw new ForbiddenException('VIEWER role cannot delete tasks');
    }

    // Check authorization
    if (userRole === Role.ADMIN) {
      // ADMIN: Can delete any task in own organization
      if (task.organization.id !== user.organization.id) {
        throw new ForbiddenException(
          'You can only delete tasks in your organization'
        );
      }
    } else if (userRole === Role.OWNER) {
      // OWNER: Can delete tasks in org or child org
      const isOwnOrg = task.organization.id === user.organization.id;
      const isChildOrg =
        task.organization.parent?.id === user.organization.id;

      if (!isOwnOrg && !isChildOrg) {
        throw new ForbiddenException(
          'You can only delete tasks in your organization or child organizations'
        );
      }
    }

    await this.taskRepository.remove(task);

    this.auditService.log(userId, 'DELETE_TASK', {
      taskId: task.id,
      title: task.title,
    });
  }
}
