import { v4 as uuidv4 } from 'uuid';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum FrontendAction {
  PAGE_VIEW = 'PAGE_VIEW',
  CLICK = 'CLICK',
  FORM_SUBMIT = 'FORM_SUBMIT',
  API_REQUEST = 'API_REQUEST',
  API_RESPONSE = 'API_RESPONSE',
  API_ERROR = 'API_ERROR',
  ERROR = 'ERROR',
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
  NAVIGATION = 'NAVIGATION',
  CUSTOM_EVENT = 'CUSTOM_EVENT',
}

interface FrontendLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  action: FrontendAction;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId: string;
  correlationId: string;
  pageUrl: string;
  userAgent: string;
  screenResolution: string;
}

class FrontendLogger {
  private sessionId: string;
  private correlationId: string;
  private logBuffer: FrontendLogEntry[] = [];
  private flushInterval: NodeJS.Timeout;
  private readonly BUFFER_SIZE = 50;
  private readonly FLUSH_INTERVAL = 10000;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.correlationId = uuidv4();
    this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('log_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('log_session_id', sessionId);
    }
    return sessionId;
  }

  private createLogEntry(
    level: LogLevel,
    action: FrontendAction,
    message: string,
    metadata?: Record<string, any>,
  ): FrontendLogEntry {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      action,
      message,
      metadata,
      userId: this.getUserId(),
      sessionId: this.sessionId,
      correlationId: this.correlationId,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenResolution: typeof window !== 'undefined' 
        ? `${window.screen.width}x${window.screen.height}` 
        : '',
    };
  }

  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user)?.id : undefined;
  }

  log(level: LogLevel, action: FrontendAction, message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry(level, action, message, metadata);
    
    this.logBuffer.push(entry);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${action}: ${message}`, metadata);
    }

    if (this.logBuffer.length >= this.BUFFER_SIZE) {
      this.flush();
    }
  }

  debug(action: FrontendAction, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, action, message, metadata);
  }

  info(action: FrontendAction, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, action, message, metadata);
  }

  warn(action: FrontendAction, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, action, message, metadata);
  }

  error(action: FrontendAction, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, action, message, metadata);
  }

  fatal(action: FrontendAction, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.FATAL, action, message, metadata);
    this.flush();
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch('/api/v1/frontend-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
        keepalive: true,
      });
    } catch (err) {
      const failed = JSON.parse(localStorage.getItem('failed_logs') || '[]');
      failed.push(...logs);
      localStorage.setItem('failed_logs', JSON.stringify(failed.slice(-100)));
    }
  }

  async retryFailedLogs(): Promise<void> {
    const failed = JSON.parse(localStorage.getItem('failed_logs') || '[]');
    if (failed.length === 0) return;

    localStorage.removeItem('failed_logs');

    try {
      await fetch('/api/v1/frontend-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: failed }),
      });
    } catch {
      const current = JSON.parse(localStorage.getItem('failed_logs') || '[]');
      localStorage.setItem('failed_logs', JSON.stringify([...current, ...failed].slice(-100)));
    }
  }

  newCorrelationId(): string {
    this.correlationId = uuidv4();
    return this.correlationId;
  }

  getCorrelationId(): string {
    return this.correlationId;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const frontendLogger = new FrontendLogger();
