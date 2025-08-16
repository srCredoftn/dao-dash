import { Request, Response, NextFunction } from 'express';

interface LogData {
  method: string;
  url: string;
  status?: number;
  responseTime?: number;
  ip: string;
  userAgent?: string;
  userId?: string;
  timestamp: string;
}

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Store original res.end function
  const originalEnd = res.end;

  // Override res.end to capture response time and status
  res.end = function (this: Response, ...args: any[]) {
    const responseTime = Date.now() - startTime;
    
    const logData: LogData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      timestamp,
    };

    // Color coding for different status codes
    let statusColor = '';
    if (res.statusCode >= 500) {
      statusColor = '\x1b[31m'; // Red
    } else if (res.statusCode >= 400) {
      statusColor = '\x1b[33m'; // Yellow
    } else if (res.statusCode >= 300) {
      statusColor = '\x1b[36m'; // Cyan
    } else {
      statusColor = '\x1b[32m'; // Green
    }

    const resetColor = '\x1b[0m';

    // Log format: METHOD URL STATUS RESPONSE_TIME USER_ID
    const logMessage = [
      `${statusColor}${logData.method}${resetColor}`,
      logData.url,
      `${statusColor}${logData.status}${resetColor}`,
      `${logData.responseTime}ms`,
      logData.userId ? `[${logData.userId}]` : '[anonymous]',
    ].join(' ');

    console.log(`🌐 ${logMessage}`);

    // Call original end function
    originalEnd.apply(this, args);
  };

  next();
};

// Request ID middleware for tracing
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = Math.random().toString(36).substring(2, 15);
  (req as any).requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

// Security logging for sensitive operations
export const securityLogger = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`🔒 Security Event: ${operation}`, {
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      requestId: (req as any).requestId,
    });

    next();
  };
};
