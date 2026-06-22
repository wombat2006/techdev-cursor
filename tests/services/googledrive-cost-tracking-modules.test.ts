import { calculateModelCost, createDefaultModelPricing } from '../../src/services/cost-tracking/model-pricing';
import { TaskType } from '../../src/types/huggingface';

describe('googledrive-connector SRP modules', () => {
  it('exports types from shim path', async () => {
    const mod = await import('../../src/services/googledrive-connector');
    expect(mod.GoogleDriveRAGConnector).toBeDefined();
    expect(mod.default).toBe(mod.GoogleDriveRAGConnector);
  });
});

describe('cost-tracking SRP modules', () => {
  it('calculateModelCost applies premium multiplier', () => {
    const pricing = createDefaultModelPricing();
    const basic = calculateModelCost(pricing, 'rinna/japanese-gpt2-medium', 1000, 500, TaskType.BASIC);
    const premium = calculateModelCost(pricing, 'rinna/japanese-gpt2-medium', 1000, 500, TaskType.PREMIUM);
    expect(premium).toBeGreaterThan(basic);
  });
});
