export async function getSystemMetrics(): Promise<{
  memory_usage: number;
  cpu_usage: number;
  active_connections: number;
}> {
  const memUsage = process.memoryUsage();

  return {
    memory_usage: Math.round(memUsage.heapUsed / 1024 / 1024),
    cpu_usage: process.cpuUsage().user / 1000000,
    active_connections: 0,
  };
}
