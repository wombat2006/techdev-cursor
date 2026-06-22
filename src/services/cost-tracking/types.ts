export interface CostSummary {
  totalCost: number;
  monthlyBudget: number;
  budgetUsed: number;
  budgetRemaining: number;
  requestCount: number;
  averageCostPerRequest: number;
  topModels: Array<{
    model: string;
    cost: number;
    requests: number;
  }>;
  topUsers: Array<{
    userId: string;
    cost: number;
    requests: number;
  }>;
}

export interface BudgetAlert {
  alertType: 'warning' | 'critical' | 'exceeded';
  currentUsage: number;
  budgetLimit: number;
  usagePercentage: number;
  message: string;
  timestamp: Date;
}
