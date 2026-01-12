import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

@Component({
  selector: 'app-tasks',
  standalone: false,
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  newTaskTitle = '';
  newTaskDescription = '';
  error = '';

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadTasks();
  }

  loadTasks(): void {
    this.http.get<Task[]>(`${this.apiUrl}/tasks`).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (err) => {
        this.error = 'Failed to load tasks';
        console.error('Load tasks error:', err);
      },
    });
  }

  createTask(): void {
    if (!this.newTaskTitle.trim()) {
      return;
    }

    this.http
      .post<Task>(`${this.apiUrl}/tasks`, {
        title: this.newTaskTitle,
        description: this.newTaskDescription,
      })
      .subscribe({
        next: (task) => {
          this.tasks.push(task);
          this.newTaskTitle = '';
          this.newTaskDescription = '';
          this.error = '';
        },
        error: (err) => {
          this.error = 'Failed to create task';
          console.error('Create task error:', err);
        },
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
