import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UsageData {
  providerKey: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  userId?: string;
  requestType?: string;
}

export interface ProviderPricing {
  type: 'free' | 'flat' | 'input_output';
  costPer1k?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  modelPricing?: Record<string, {
    inputCostPer1k?: number;
    outputCostPer1k?: number;
    costPer1k?: number;
  }>;
}

export class LLMUsageService {
  private static instance: LLMUsageService;

  private constructor() {}

  static getInstance(): LLMUsageService {
    if (!LLMUsageService.instance) {
      LLMUsageService.instance = new LLMUsageService();
    }
    return LLMUsageService.instance;
  }

  async recordUsage(usageData: UsageData, pricing: ProviderPricing): Promise<void> {
    const { promptTokens, completionTokens, totalTokens } = usageData;
    
    // Calculate costs based on pricing structure
    let inputCost = 0;
    let outputCost = 0;
    
    if (pricing.type === 'free') {
      inputCost = 0;
      outputCost = 0;
    } else if (pricing.type === 'flat') {
      const costPerToken = (pricing.costPer1k || 0) / 1000;
      inputCost = totalTokens * costPerToken;
      outputCost = 0;
    } else if (pricing.type === 'input_output') {
      // Get model-specific pricing if available
      let inputCostPer1k = pricing.inputCostPer1k || 0;
      let outputCostPer1k = pricing.outputCostPer1k || 0;
      
      if (usageData.model && pricing.modelPricing && pricing.modelPricing[usageData.model]) {
        const modelPricing = pricing.modelPricing[usageData.model];
        inputCostPer1k = modelPricing.inputCostPer1k || inputCostPer1k;
        outputCostPer1k = modelPricing.outputCostPer1k || outputCostPer1k;
      }
      
      inputCost = (promptTokens / 1000) * inputCostPer1k;
      outputCost = (completionTokens / 1000) * outputCostPer1k;
    }
    
    const totalCost = inputCost + outputCost;

    // Record the usage - make userId optional for test requests
    const usageDataToSave: any = {
      providerKey: usageData.providerKey,
      model: usageData.model,
      promptTokens,
      completionTokens,
      totalTokens,
      inputCost,
      outputCost,
      totalCost,
      requestType: usageData.requestType,
    };

    // Only include userId if it's provided and not a test request
    if (usageData.userId && usageData.requestType !== 'test') {
      usageDataToSave.userId = usageData.userId;
    }

    await prisma.lLMUsage.create({
      data: usageDataToSave,
    });

    // Update the usage summary
    await this.updateUsageSummary(usageData.providerKey, {
      promptTokens,
      completionTokens,
      totalTokens,
      inputCost,
      outputCost,
      totalCost,
    });
  }

  private async updateUsageSummary(providerKey: string, usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
  }): Promise<void> {
    await prisma.lLMUsageSummary.upsert({
      where: { providerKey },
      update: {
        totalPromptTokens: { increment: usage.promptTokens },
        totalCompletionTokens: { increment: usage.completionTokens },
        totalTokens: { increment: usage.totalTokens },
        totalInputCost: { increment: usage.inputCost },
        totalOutputCost: { increment: usage.outputCost },
        totalCost: { increment: usage.totalCost },
        requestCount: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        providerKey,
        totalPromptTokens: usage.promptTokens,
        totalCompletionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        totalInputCost: usage.inputCost,
        totalOutputCost: usage.outputCost,
        totalCost: usage.totalCost,
        requestCount: 1,
      },
    });
  }

  async getUsageSummary(providerKey: string) {
    return await prisma.lLMUsageSummary.findUnique({
      where: { providerKey },
    });
  }

  async getAllUsageSummaries() {
    return await prisma.lLMUsageSummary.findMany({
      orderBy: { totalCost: 'desc' },
    });
  }

  async resetUsageSummary(providerKey: string): Promise<void> {
    await prisma.lLMUsageSummary.update({
      where: { providerKey },
      data: {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalInputCost: 0,
        totalOutputCost: 0,
        totalCost: 0,
        requestCount: 0,
        lastResetAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getUsageHistory(providerKey?: string, userId?: string, limit = 100) {
    const where: any = {};
    if (providerKey) where.providerKey = providerKey;
    if (userId) where.userId = userId;

    return await prisma.lLMUsage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async getTotalUsageStats() {
    const summaries = await this.getAllUsageSummaries();
    
    return {
      totalProviders: summaries.length,
      totalRequests: summaries.reduce((sum: number, s: any) => sum + s.requestCount, 0),
      totalTokens: summaries.reduce((sum: number, s: any) => sum + s.totalTokens, 0),
      totalCost: summaries.reduce((sum: number, s: any) => sum + s.totalCost, 0),
      providers: summaries,
    };
  }
} 