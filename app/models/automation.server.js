import prisma from "../db.server.js";

export async function createAutomation(shop, data) {
  return prisma.automation.create({
    data: {
      shop,
      ...data,
    },
  });
}

export async function getAutomations(shop) {
  return prisma.automation.findMany({
    where: { shop },
    include: {
      executions: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAutomationsByTrigger(shop, trigger) {
  return prisma.automation.findMany({
    where: { 
      shop, 
      trigger,
      isActive: true,
    },
  });
}

export async function createExecution(automationId, data) {
  return prisma.automationExecution.create({
    data: {
      automationId,
      ...data,
    },
  });
}

export async function updateExecution(id, data) {
  return prisma.automationExecution.update({
    where: { id },
    data,
  });
}