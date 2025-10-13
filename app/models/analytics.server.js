import prisma from "../db.server.js";

export async function getAnalytics(shop) {
  try {
    const automations = await prisma.automation.findMany({
      where: { shop },
      include: {
        executions: true,
      },
    });

    const totalAutomations = automations.length;
    const activeAutomations = automations.filter(a => a.isActive).length;
    
    const executions = automations.flatMap(a => a.executions);
    const successfulExecutions = executions.filter(e => e.status === 'sent').length;
    const totalExecutions = executions.length;
    const successRate = totalExecutions > 0 ? ((successfulExecutions / totalExecutions) * 100).toFixed(1) : 0;
    
    const todayExecutions = executions.filter(e => {
      const today = new Date();
      const executionDate = new Date(e.createdAt);
      return executionDate.toDateString() === today.toDateString();
    }).length;

    const campaignPerformance = automations.map(automation => {
      const automationExecutions = automation.executions;
      const successful = automationExecutions.filter(e => e.status === 'sent').length;
      const total = automationExecutions.length;
      const completion = total > 0 ? Math.round((successful / total) * 100) : 0;
      
      return {
        name: automation.name,
        completion,
        tone: completion >= 80 ? 'success' : 'primary'
      };
    }).slice(0, 3);

    return {
      totalAutomations,
      activeAutomations,
      successRate,
      todayExecutions,
      campaignPerformance,
      recentActivity: executions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .map(e => {
          const automation = automations.find(a => a.id === e.automationId);
          return `${automation?.name || 'Automation'} ${e.status === 'sent' ? 'sent' : 'failed'} to customer`;
        })
    };
  } catch (error) {
    console.error('Analytics error:', error);
    return {
      totalAutomations: 0,
      activeAutomations: 0,
      successRate: 0,
      todayExecutions: 0,
      campaignPerformance: [],
      recentActivity: []
    };
  }
}