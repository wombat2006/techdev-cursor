import type { MCPOptimizationRecommendation, MCPPerformanceMetrics } from './types';

export function generateNewRecommendations(
  latest: MCPPerformanceMetrics
): MCPOptimizationRecommendation[] {
  const newRecommendations: MCPOptimizationRecommendation[] = [];

  if (latest.cache_hit_rate < 0.7) {
    newRecommendations.push({
      id: 'improve_cache_efficiency',
      category: 'performance',
      priority: 'high',
      title: 'Improve Cache Efficiency',
      description: 'Cache hit rate is below optimal levels',
      impact: `Potential ${((0.8 - latest.cache_hit_rate) * 100).toFixed(1)}% performance improvement`,
      implementation_effort: 'medium',
      estimated_improvement: '20-30% response time reduction',
      action_items: [
        'Increase cache TTL for stable operations',
        'Implement cache warming strategies',
        'Optimize cache key generation',
      ],
    });
  }

  if (latest.average_response_time > 3000) {
    newRecommendations.push({
      id: 'optimize_response_time',
      category: 'performance',
      priority: 'high',
      title: 'Optimize Response Time',
      description: 'Average response time exceeds 3 seconds',
      impact: 'Improved user experience and system throughput',
      implementation_effort: 'high',
      estimated_improvement: '40-50% response time reduction',
      action_items: [
        'Enable request batching for similar operations',
        'Implement connection pooling',
        'Optimize database queries',
        'Add response compression',
      ],
    });
  }

  if (latest.cost_efficiency_score < 0.6) {
    newRecommendations.push({
      id: 'improve_cost_efficiency',
      category: 'cost',
      priority: 'medium',
      title: 'Improve Cost Efficiency',
      description: 'Cost efficiency is below optimal levels',
      impact: `Potential cost reduction of ${((1 - latest.cost_efficiency_score) * 30).toFixed(0)}%`,
      implementation_effort: 'medium',
      estimated_improvement: '15-25% cost reduction',
      action_items: [
        'Implement intelligent model selection',
        'Optimize token usage',
        'Use caching for repeated queries',
        'Enable request batching',
      ],
    });
  }

  return newRecommendations;
}

export function mergeRecommendations(
  existing: MCPOptimizationRecommendation[],
  incoming: MCPOptimizationRecommendation[]
): MCPOptimizationRecommendation[] {
  const merged = [...existing];
  for (const rec of incoming) {
    if (!merged.find((r) => r.id === rec.id)) {
      merged.push(rec);
    }
  }
  return merged;
}

export function pruneOldRecommendations(
  recommendations: MCPOptimizationRecommendation[],
  retentionMs: number = 7 * 24 * 60 * 60 * 1000
): MCPOptimizationRecommendation[] {
  const cutoff = Date.now() - retentionMs;
  return recommendations.filter(
    (r) => Date.now() - parseInt(r.id.split('_').pop() || '0', 10) < cutoff
  );
}
