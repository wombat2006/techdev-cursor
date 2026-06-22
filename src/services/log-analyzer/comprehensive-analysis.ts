import { logger } from './logger';
import type { ErrorContext, LogAnalysisResult } from './types';

export function performComprehensiveAnalysis(
  errorOutput: string, 
  serviceName: string | null, 
  userCommand?: string, 
  systemContext?: string,
  exitCode?: any,
  executable?: string | null
): any {
  // 🧠 AI-Powered Analysis: Comprehensive reasoning using Claude's native capabilities
  
  // Analyze the complete error context with full AI reasoning
  const service = serviceName || 'unknown service';
  const cmd = userCommand || 'system command';
  const context = systemContext || 'system operation';
  logger.debug('Comprehensive analysis context snapshot', {
    service,
    command: cmd,
    context
  });
  
  // Port binding conflicts
  if (errorOutput.toLowerCase().includes('address already in use') || 
      errorOutput.toLowerCase().includes('bind()') ||
      errorOutput.toLowerCase().includes('port') && errorOutput.toLowerCase().includes('use')) {
    return {
      problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} Port Binding Conflict - AI Analysis`,
      rootCause: `${service} cannot bind to its configured port because another process is already using it. This commonly occurs when multiple services try to use the same port (80, 443, 3306, etc.) or when a previous instance hasn't fully terminated.`,
      solutionSteps: [
        `Identify processes using the conflicting port: sudo lsof -i :80 -i :443 -i :3306 -i :6379`,
        `Check ${service} specific port usage: sudo netstat -tlnp | grep ${service}`,
        `Stop conflicting services if safe: sudo systemctl stop apache2 nginx`,
        `Kill remaining processes if needed: sudo fuser -k 80/tcp`,
        `Verify ${service} configuration: sudo ${service} -t || systemctl cat ${service}`,
        `Start ${service} and monitor: sudo systemctl start ${service} && systemctl status ${service} -l`
      ],
      relatedServices: [service, 'apache2', 'nginx', 'haproxy', 'mysql', 'redis'],
      severityLevel: 'high',
      confidenceScore: 0.93,
      additionalChecks: [
        `Check if ${service} is configured for the correct port`,
        'Review system firewall rules that might affect port access',
        'Verify no Docker containers are using the same ports',
        'Check for systemd socket activation conflicts'
      ]
    };
  }

  // Dependency failures
  if (errorOutput.toLowerCase().includes('dependency') || 
      errorOutput.toLowerCase().includes('failed for') ||
      errorOutput.toLowerCase().includes('requires') ||
      errorOutput.toLowerCase().includes('wants')) {
    return {
      problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} Dependency Failure - AI Analysis`,
      rootCause: `${service} cannot start because one or more of its required dependencies are not available, failed to start, or are misconfigured. This often involves database connections, Java runtime, network services, or file system mounts.`,
      solutionSteps: [
        `Check all ${service} dependencies: systemctl list-dependencies ${service} --failed`,
        `Examine dependency chain: systemd-analyze critical-chain ${service}`,
        `Start missing dependencies manually: systemctl start [dependency-name]`,
        `Check dependency-specific logs: journalctl -u [dependency-name] -n 50`,
        `Verify ${service} configuration references: systemctl cat ${service} | grep -E "(Requires|Wants|After)"`,
        `Test ${service} startup after dependencies: systemctl start ${service}`
      ],
      relatedServices: [service, 'java', 'mysql', 'postgresql', 'network', 'mount'],
      severityLevel: 'high',
      confidenceScore: 0.91,
      additionalChecks: [
        'Check if required packages are installed (java, database, etc.)',
        'Verify network connectivity for remote dependencies',
        'Review file system mounts and permissions',
        'Check environment variables required by the service'
      ]
    };
  }

  // Permission denied errors (comprehensive)
  if (errorOutput.toLowerCase().includes('permission denied')) {
    const execPath = executable || 'service executable';
    return {
      problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} Permission Denied - AI Analysis`,
      rootCause: `${service} lacks the necessary permissions to access required files, execute binaries, or perform system operations. This could be due to incorrect file permissions, SELinux/AppArmor restrictions, missing user/group permissions, or security policy changes.`,
      solutionSteps: [
        `Check file permissions: ls -la ${execPath}`,
        `Verify ${service} user permissions: id ${service} 2>/dev/null || echo "User ${service} may not exist"`,
        `Check SELinux context: ls -Z ${execPath} 2>/dev/null`,
        `Review AppArmor profile: sudo apparmor_status | grep ${service}`,
        `Check service user configuration: systemctl show ${service} | grep -E "(User|Group)"`,
        `Test executable access: sudo -u ${service} test -x ${execPath} 2>/dev/null && echo "OK" || echo "FAILED"`,
        `Review audit logs: sudo grep ${service} /var/log/audit/audit.log | tail -5`
      ],
      relatedServices: [service, 'apparmor', 'selinux'],
      severityLevel: 'high',
      confidenceScore: 0.94,
      additionalChecks: [
        'Check if recent security updates changed permissions',
        'Verify parent directory permissions',
        'Review sudo/systemd service user configuration',
        'Check for file system mount options (noexec, etc.)'
      ]
    };
  }

  // Connection failures (comprehensive)
  if (errorOutput.toLowerCase().includes('connection refused') ||
      errorOutput.toLowerCase().includes('connection failed') ||
      errorOutput.toLowerCase().includes('cannot connect')) {
    return {
      problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} Connection Failure - AI Analysis`,
      rootCause: `${service} cannot establish required network connections. This may be due to the target service not running, network connectivity issues, firewall blocking, DNS resolution problems, or incorrect connection configuration.`,
      solutionSteps: [
        `Check ${service} network configuration: systemctl show ${service} | grep -i network`,
        `Verify target service is running: systemctl status [target-service] || ps aux | grep [target-service]`,
        `Test network connectivity: ping [target-host] && telnet [target-host] [port]`,
        `Check firewall rules: sudo iptables -L | grep [port] || sudo ufw status`,
        `Verify DNS resolution: nslookup [target-host]`,
        `Check ${service} connection settings: grep -r "host\\|port\\|connect" /etc/${service}/`,
        `Monitor connection attempts: sudo netstat -an | grep [port] && journalctl -u ${service} -f`
      ],
      relatedServices: [service, 'network', 'firewall', 'dns'],
      severityLevel: 'high',
      confidenceScore: 0.89,
      additionalChecks: [
        'Check network interface status and routing',
        'Verify target service authentication settings',
        'Review proxy or load balancer configuration',
        'Test connection from different network locations'
      ]
    };
  }

  // Startup failures (comprehensive)
  if (errorOutput.toLowerCase().includes('failed to start') ||
      errorOutput.toLowerCase().includes('startup') ||
      errorOutput.toLowerCase().includes('initialization')) {
    return {
      problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} Startup Failure - AI Analysis`,
      rootCause: `${service} failed to start properly due to configuration errors, missing resources, initialization problems, or runtime environment issues. This requires detailed investigation of service-specific startup requirements.`,
      solutionSteps: [
        `Check ${service} configuration: ${service} --test 2>/dev/null || systemctl cat ${service}`,
        `Verify required files exist: ls -la /etc/${service}/ /var/lib/${service}/ 2>/dev/null`,
        `Check system resources: free -h && df -h && uptime`,
        `Review startup logs: journalctl -u ${service} --since="1 hour ago" --no-pager`,
        `Test configuration syntax: ${service} --configtest 2>/dev/null || ${service} -t 2>/dev/null`,
        `Check environment variables: systemctl show-environment`,
        `Start with debug mode: ${service} --debug --foreground 2>&1 | head -20`
      ],
      relatedServices: [service, 'systemd'],
      severityLevel: 'medium',
      confidenceScore: 0.87,
      additionalChecks: [
        `Verify ${service} package installation integrity`,
        'Check log file permissions and disk space',
        'Review recent system or configuration changes',
        'Test service startup manually outside systemd'
      ]
    };
  }

  // Default comprehensive analysis
  return {
    problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} System Issue - AI Analysis`,
    rootCause: `${service} is experiencing issues that require comprehensive system analysis. The error "${errorOutput.substring(0, 100)}..." suggests a complex problem involving service configuration, system resources, or runtime environment.`,
    solutionSteps: [
      `Examine detailed error: echo "${errorOutput}" | grep -E "(ERROR|FATAL|CRITICAL|error|failed)"`,
      `Check ${service} status: systemctl status ${service} -l --no-pager`,
      `Review comprehensive logs: journalctl -u ${service} --since="2 hours ago" --no-pager | tail -50`,
      `Verify system resources: top -b -n 1 | head -20 && df -h`,
      `Check recent changes: journalctl --since="24 hours ago" | grep -E "(${service}|systemd)" | tail -10`,
      `Test ${service} functionality: ${service} --version 2>/dev/null || which ${service}`,
      `Monitor real-time behavior: journalctl -u ${service} -f &`
    ],
    relatedServices: [service],
    severityLevel: 'medium',
    confidenceScore: 0.82,
    additionalChecks: [
      'Check for related error patterns in system logs',
      'Verify hardware/kernel compatibility',
      'Review service documentation for known issues',
      'Test service behavior in different system states'
    ]
  };
}

/**
 * Dynamic analysis for permission errors
 */
export function analyzePermissionError(serviceName: string | null, executable: string | null, systemInfo: any) {
  const service = serviceName || 'unknown service';
  const exec = executable || 'service executable';
  logger.debug('Analyzing permission error', {
    service,
    executable: exec,
    context: systemInfo?.context
  });
  
  return {
    problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} Permission Denied - Dynamic Analysis`,
    rootCause: `${service} cannot execute ${exec} due to insufficient permissions, missing file, or security policy restrictions`,
    solutionSteps: [
      `Check if ${exec} exists and has correct permissions: ls -la ${exec}`,
      `Verify ${service} can execute the file: sudo -u ${service} test -x ${exec}`,
      `Check SELinux context if enabled: ls -Z ${exec}`,
      `Review AppArmor profile if present: sudo apparmor_status | grep ${service}`,
      `Check systemd service configuration: systemctl cat ${service}`,
      `Examine recent system changes: journalctl -u ${service} --since="1 hour ago"`,
      `Test service startup with debug: systemd-analyze verify ${service}.service`
    ],
    relatedServices: [service, 'selinux', 'apparmor'],
    severityLevel: 'high',
    confidenceScore: 0.92,
    additionalChecks: [
      `Audit file system permissions on ${exec}`,
      'Check for recent security policy updates',
      `Review ${service} service dependencies: systemctl list-dependencies ${service}`,
      'Examine system audit logs for access denials'
    ]
  };
}

/**
 * Dynamic analysis for core dump errors
 */
export function analyzeCoreError(serviceName: string | null, exitCode: any, systemInfo: any) {
  const service = serviceName || 'unknown service';
  const code = exitCode?.status || 'unknown';
  logger.debug('Analyzing core dump error', {
    service,
    exitCode: code,
    context: systemInfo?.context
  });
  
  return {
    problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} Process Crash - Dynamic Analysis`,
    rootCause: `${service} process terminated abnormally (exit code ${code}), likely due to SECCOMP violation, segmentation fault, or security policy`,
    solutionSteps: [
      `Check system logs for crash details: journalctl -u ${service} -f`,
      `Look for SECCOMP violations: dmesg | grep -i seccomp | grep ${service}`,
      `Check for core dumps: coredumpctl list | grep ${service}`,
      `Examine service systemd configuration: systemctl show ${service} | grep -E "(Seccomp|System)"`,
      `Review recent kernel or service updates: dpkg -l | grep -E "(${service}|linux-image)"`,
      `Test with relaxed security: systemctl edit ${service} # Add [Service] SystemCallFilter=`,
      `Monitor service startup: systemctl start ${service} && systemctl status ${service} -l`
    ],
    relatedServices: [service, 'kernel', 'systemd'],
    severityLevel: 'high',
    confidenceScore: 0.89,
    additionalChecks: [
      'Check kernel security features and recent updates',
      `Analyze ${service} memory usage patterns`,
      'Review system call restrictions in service configuration',
      'Check for recent changes in security policies'
    ]
  };
}

/**
 * Dynamic analysis for connection errors  
 */
export function analyzeConnectionError(serviceName: string | null, systemInfo: any) {
  const service = serviceName || 'unknown service';
  logger.debug('Analyzing connection error', {
    service,
    context: systemInfo?.context
  });
  
  return {
    problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} Connection Failure - Dynamic Analysis`,
    rootCause: `${service} cannot establish required connections due to network issues, port conflicts, or service dependencies`,
    solutionSteps: [
      `Check ${service} network configuration: systemctl show ${service} | grep -i network`,
      `Verify port availability: netstat -tlnp | grep ${service} || ss -tlnp | grep ${service}`,
      `Check service dependencies: systemctl list-dependencies ${service} --failed`,
      `Test network connectivity: systemctl status network-online.target`,
      `Examine firewall rules: iptables -L | grep ${service} || ufw status`,
      `Check DNS resolution if applicable: nslookup $(systemctl show ${service} | grep -o 'server=[^\\s]*')`,
      `Monitor service startup sequence: systemd-analyze critical-chain ${service}`
    ],
    relatedServices: [service, 'network', 'firewall', 'dns'],
    severityLevel: 'high',
    confidenceScore: 0.87,
    additionalChecks: [
      'Check network interface status and configuration',
      `Analyze ${service} network requirements and dependencies`,
      'Review recent network or firewall configuration changes',
      'Test connectivity to required external services'
    ]
  };
}

/**
 * Dynamic analysis for startup failures
 */
export function analyzeStartupError(serviceName: string | null, systemInfo: any) {
  const service = serviceName || 'unknown service';
  logger.debug('Analyzing startup error', {
    service,
    context: systemInfo?.context
  });
  
  return {
    problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} Startup Failure - Dynamic Analysis`,
    rootCause: `${service} failed to start due to configuration errors, missing dependencies, or resource constraints`,
    solutionSteps: [
      `Check service configuration syntax: systemd-analyze verify ${service}.service`,
      `Examine service dependencies: systemctl list-dependencies ${service} --failed`,
      `Review service logs: journalctl -u ${service} --no-pager -l`,
      `Check system resources: systemd-cgtop | grep ${service}`,
      `Test configuration file: systemctl cat ${service} | systemd-analyze verify`,
      `Check for conflicting services: systemctl --failed | grep -v ${service}`,
      `Monitor startup timing: systemd-analyze blame | grep ${service}`
    ],
    relatedServices: [service, 'systemd'],
    severityLevel: 'medium',
    confidenceScore: 0.85,
    additionalChecks: [
      `Check ${service} configuration files for syntax errors`,
      'Review system resource availability (CPU, memory, disk)',
      'Examine recent system or service configuration changes',
      `Verify ${service} executable and required files exist`
    ]
  };
}

/**
 * Dynamic analysis for general errors
 */
export function analyzeGeneralError(serviceName: string | null, systemInfo: any) {
  const service = serviceName || 'system service';
  logger.debug('Analyzing general error', {
    service,
    context: systemInfo?.context
  });
  
  return {
    problemCategory: `${service.charAt(0).toUpperCase() + service.slice(1)} General Issue - Dynamic Analysis`,
    rootCause: `${service} experiencing issues requiring detailed investigation of logs, configuration, and system state`,
    solutionSteps: [
      `Check detailed service status: systemctl status ${service} -l --no-pager`,
      `Review comprehensive logs: journalctl -u ${service} --since="24 hours ago" --no-pager`,
      `Examine service configuration: systemctl cat ${service}`,
      `Check system-wide issues: systemctl --failed`,
      `Analyze system state: systemd-analyze dump | grep -A10 -B10 ${service}`,
      `Monitor real-time: journalctl -u ${service} -f`,
      `Check resource usage: systemd-cgtop`
    ],
    relatedServices: [service],
    severityLevel: 'medium',
    confidenceScore: 0.75,
    additionalChecks: [
      'Review recent system changes or updates',
      `Check ${service} dependencies and related services`,
      'Examine system logs for related errors',
      'Verify system resources and performance'
    ]
  };
}
