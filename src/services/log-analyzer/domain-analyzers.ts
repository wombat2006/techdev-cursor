import { logger } from './logger';
import type { LogAnalysisResult } from './types';
import { extractErrorContext, generateDynamicSolution } from './error-context';

export async function analyzeSystemdLogs(errorOutput: string, userCommand?: string, systemContext?: string): Promise<LogAnalysisResult> {
  logger.debug('Analyzing systemd logs with context', {
    userCommand,
    systemContext
  });

  // 🔍 Dynamic Analysis: Extract key information from error
  const errorAnalysis = extractErrorContext(errorOutput, userCommand, systemContext);
  
  // 🧠 AI-Powered Analysis: Get dynamic solution from Context7 systemd knowledge
  const dynamicSolution = await generateDynamicSolution(errorAnalysis);
  
  if (dynamicSolution) {
    return dynamicSolution;
  }

  // Fallback to pattern-based analysis if dynamic analysis fails
  return analyzeGeneralLogs(errorOutput, userCommand, systemContext);
}

/**
 * Analyze nginx logs
 */
export function analyzeNginxLogs(errorOutput: string, userCommand?: string, systemContext?: string): LogAnalysisResult {
  const content = errorOutput.toLowerCase();
  logger.debug('Analyzing nginx logs with context', {
    userCommand,
    systemContext
  });

  if (content.includes('403 forbidden')) {
    return {
      issue_identified: true,
      problem_category: 'nginx 403 Forbidden Error',
      root_cause: 'nginx is denying access due to permission or configuration issues',
      solution_steps: [
        'Check file permissions: ls -la /var/www/html/',
        'Verify nginx user has read access to web directory',
        'Check nginx configuration: sudo nginx -t',
        'Review access rules in nginx.conf',
        'Check directory index configuration',
        'Restart nginx: sudo systemctl restart nginx'
      ],
      related_services: ['nginx'],
      severity_level: 'medium',
      confidence_score: 0.8,
      additional_checks: [
        'Check SELinux context if enabled',
        'Verify upstream server status if using proxy',
        'Review nginx error logs for details'
      ]
    };
  }

  if (content.includes('could not bind') || content.includes('address already in use')) {
    return {
      issue_identified: true,
      problem_category: 'nginx Port Binding Failure',
      root_cause: 'nginx cannot bind to the configured port (typically 80/443) because it is already in use',
      solution_steps: [
        'Check which process is using port 80/443: sudo lsof -i :80',
        'Stop conflicting web server if present: sudo systemctl stop apache2',
        'Check nginx configuration: sudo nginx -t',
        'Start nginx: sudo systemctl start nginx',
        'Verify nginx is listening: sudo netstat -tlnp | grep nginx'
      ],
      related_services: ['nginx', 'apache2'],
      severity_level: 'high',
      confidence_score: 0.9,
      additional_checks: [
        'Check firewall configuration',
        'Verify SSL certificate paths if HTTPS',
        'Review nginx virtual host configurations'
      ]
    };
  }

  return {
    issue_identified: true,
    problem_category: 'nginx Configuration Issue',
    root_cause: 'General nginx configuration or runtime problem',
    solution_steps: [
      'Test nginx configuration: sudo nginx -t',
      'Check nginx status: sudo systemctl status nginx',
      'Review error logs: sudo tail -f /var/log/nginx/error.log',
      'Check access logs: sudo tail -f /var/log/nginx/access.log',
      'Reload configuration: sudo systemctl reload nginx'
    ],
    related_services: ['nginx'],
    severity_level: 'medium',
    confidence_score: 0.75,
    additional_checks: [
      'Check disk space in log directory',
      'Verify worker process limits',
      'Review upstream server health'
    ]
  };
}

/**
 * Analyze MySQL/MariaDB logs
 */
export function analyzeMysqlLogs(errorOutput: string, userCommand?: string, systemContext?: string): LogAnalysisResult {
  const content = errorOutput.toLowerCase();
  logger.debug('Analyzing MySQL logs with context', {
    userCommand,
    systemContext
  });

  if (content.includes('connection refused') && content.includes('3306')) {
    return {
      issue_identified: true,
      problem_category: 'MySQL Connection Refused',
      root_cause: 'MySQL service is not running or not accepting connections on port 3306',
      solution_steps: [
        'Check MySQL service status: sudo systemctl status mysql',
        'Start MySQL if stopped: sudo systemctl start mysql',
        'Check if MySQL is listening: sudo netstat -tlnp | grep 3306',
        'Review MySQL error log: sudo tail -f /var/log/mysql/error.log',
        'Check MySQL configuration: /etc/mysql/my.cnf',
        'Test connection: mysql -u root -p'
      ],
      related_services: ['mysql', 'mariadb'],
      severity_level: 'high',
      confidence_score: 0.9,
      additional_checks: [
        'Check disk space in MySQL data directory',
        'Verify MySQL user permissions',
        'Check for corrupted MySQL tables'
      ]
    };
  }

  if (content.includes('access denied') || content.includes('authentication failed')) {
    return {
      issue_identified: true,
      problem_category: 'MySQL Authentication Failure',
      root_cause: 'MySQL authentication failed due to incorrect credentials or user permissions',
      solution_steps: [
        'Reset MySQL root password if needed',
        'Check user privileges: SHOW GRANTS FOR \'user\'@\'host\'',
        'Create user if missing: CREATE USER \'user\'@\'host\' IDENTIFIED BY \'password\'',
        'Grant necessary permissions: GRANT ALL PRIVILEGES ON database.* TO \'user\'@\'host\'',
        'Flush privileges: FLUSH PRIVILEGES',
        'Test connection with correct credentials'
      ],
      related_services: ['mysql'],
      severity_level: 'medium',
      confidence_score: 0.85,
      additional_checks: [
        'Check MySQL user table integrity',
        'Review application connection strings',
        'Verify hostname resolution'
      ]
    };
  }

  return {
    issue_identified: true,
    problem_category: 'MySQL Database Issue',
    root_cause: 'General MySQL database problem detected',
    solution_steps: [
      'Check MySQL service: sudo systemctl status mysql',
      'Review MySQL logs: sudo tail -f /var/log/mysql/error.log',
      'Test MySQL connection: mysql -u root -p',
      'Check database status: SHOW PROCESSLIST',
      'Analyze slow queries if performance issue'
    ],
    related_services: ['mysql'],
    severity_level: 'medium',
    confidence_score: 0.7,
    additional_checks: [
      'Check MySQL configuration tuning',
      'Verify table integrity with CHECK TABLE',
      'Monitor MySQL resource usage'
    ]
  };
}

/**
 * Analyze kernel logs
 */
export function analyzeKernelLogs(errorOutput: string, userCommand?: string, systemContext?: string): LogAnalysisResult {
  const content = errorOutput.toLowerCase();
  logger.debug('Analyzing kernel logs with context', {
    userCommand,
    systemContext
  });

  if (content.includes('segmentation fault') || content.includes('segfault')) {
    return {
      issue_identified: true,
      problem_category: 'Application Segmentation Fault',
      root_cause: 'Application crashed due to memory access violation or programming error',
      solution_steps: [
        'Check system logs: sudo journalctl -b | grep segfault',
        'Identify crashing application from logs',
        'Check for core dumps: ls /var/crash/ or /tmp/core*',
        'Update application if patch available',
        'Check system memory: free -h',
        'Review application logs for additional context'
      ],
      related_services: [],
      severity_level: 'medium',
      confidence_score: 0.8,
      additional_checks: [
        'Check memory usage patterns',
        'Verify application dependencies',
        'Review recent system updates'
      ]
    };
  }

  return {
    issue_identified: true,
    problem_category: 'Kernel Issue',
    root_cause: 'Kernel-level problem requiring investigation',
    solution_steps: [
      'Check kernel messages: dmesg | tail',
      'Review system logs: sudo journalctl -b -k',
      'Check hardware status if applicable',
      'Review recent kernel updates',
      'Monitor system stability'
    ],
    related_services: [],
    severity_level: 'high',
    confidence_score: 0.7,
    additional_checks: [
      'Check hardware compatibility',
      'Review driver issues',
      'Monitor system temperature and health'
    ]
  };
}

/**
 * Analyze application logs
 */
export function analyzeApplicationLogs(errorOutput: string, userCommand?: string, systemContext?: string): LogAnalysisResult {
  logger.debug('Analyzing application logs with context', {
    sampleLength: errorOutput.length,
    userCommand,
    systemContext
  });
  return {
    issue_identified: true,
    problem_category: 'Application Error',
    root_cause: 'Application-specific error requiring analysis',
    solution_steps: [
      'Review complete error message and stack trace',
      'Check application configuration files',
      'Verify application dependencies',
      'Review application logs for pattern',
      'Check system resources available to application'
    ],
    related_services: [],
    severity_level: 'medium',
    confidence_score: 0.6,
    additional_checks: [
      'Check application version and updates',
      'Verify file permissions for application',
      'Review recent configuration changes'
    ]
  };
}

/**
 * Analyze general logs
 */
export function analyzeGeneralLogs(errorOutput: string, userCommand?: string, systemContext?: string): LogAnalysisResult {
  logger.debug('Analyzing general system logs with context', {
    sampleLength: errorOutput.length,
    userCommand,
    systemContext
  });
  return {
    issue_identified: true,
    problem_category: 'General System Error',
    root_cause: 'Error condition detected in system logs requiring investigation',
    solution_steps: [
      'Review complete error message and context',
      'Check system journal: sudo journalctl -b -p err',
      'Identify affected service or component',
      'Check system resource usage: top, df -h, free -h',
      'Review recent system changes or updates',
      'Take appropriate corrective action based on specific error'
    ],
    related_services: [],
    severity_level: 'medium',
    confidence_score: 0.6,
    additional_checks: [
      'Check system file integrity',
      'Review security logs for suspicious activity',
      'Monitor system performance metrics'
    ]
  };
}
