import { Injectable } from '@nestjs/common';

export interface AuditLog {
  userId: string;
  action: string;
  timestamp: Date;
  details?: any;
}

@Injectable()
export class AuditService {
  private logs: AuditLog[] = [];

  log(userId: string, action: string, details?: any) {
    const logEntry: AuditLog = {
      userId,
      action,
      timestamp: new Date(),
      details,
    };

    this.logs.push(logEntry);

    console.log(
      `[AUDIT] ${logEntry.timestamp.toISOString()} | User: ${userId} | Action: ${action}`,
      details ? `| Details: ${JSON.stringify(details)}` : ''
    );
  }

  getRecentLogs(limit = 100): AuditLog[] {
    return this.logs.slice(-limit).reverse();
  }
}
