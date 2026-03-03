import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { calculateSalarySchema, SalaryRuleCondition } from "@/lib/validations/salary-rule";
import { Decimal } from "@prisma/client/runtime/library";

interface BonusItem {
  ruleId: string;
  ruleName: string;
  type: string;
  amount: number;
}

interface DeductionItem {
  reason: string;
  amount: number;
}

interface WorkLogDetail {
  id: string;
  date: string;
  eventId: string | null;
  eventName: string | null;
  hours: number;
  baseSalary: number;
  bonuses: BonusItem[];
  deductions: DeductionItem[];
  totalForLog: number;
}

/**
 * Check if a condition matches for a given work context
 */
function evaluateCondition(
  condition: SalaryRuleCondition,
  context: {
    date: Date;
    dayOfWeek: number;
    startTime: string;
    eventType?: string;
    hours: number;
    isDriver: boolean;
  }
): boolean {
  // Check day of week condition
  if (condition.dayOfWeek && condition.dayOfWeek.length > 0) {
    if (!condition.dayOfWeek.includes(context.dayOfWeek)) {
      return false;
    }
  }

  // Check time range condition (e.g., early shift bonus)
  if (condition.timeRange) {
    const { start, end } = condition.timeRange;
    if (start && context.startTime < start) {
      return false;
    }
    if (end && context.startTime > end) {
      return false;
    }
  }

  // Check event type condition
  if (condition.eventType && condition.eventType.length > 0) {
    if (!context.eventType || !condition.eventType.includes(context.eventType)) {
      return false;
    }
  }

  // Check minimum hours condition
  if (condition.minHours !== undefined) {
    if (context.hours < condition.minHours) {
      return false;
    }
  }

  // Check driver condition
  if (condition.isDriver !== undefined) {
    if (context.isDriver !== condition.isDriver) {
      return false;
    }
  }

  // Holiday check would require a holiday calendar - skip for now
  // if (condition.holiday !== undefined) { ... }

  return true;
}

/**
 * Calculate bonus amount based on rule type and base salary
 */
function calculateBonusAmount(
  type: string,
  value: number,
  baseSalary: number
): number {
  if (type === "PERCENTAGE") {
    return Math.round(baseSalary * (value / 100));
  }
  return value; // FIXED amount
}

/**
 * POST /api/v1/salary/calculate
 * Calculate salary for a staff member for a given period
 */
export async function POST(request: NextRequest) {
  try {
    await requireManager();

    const body = await request.json();
    const validatedData = calculateSalarySchema.parse(body);

    const { staffId, startDate, endDate } = validatedData;

    // Verify staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Get all active salary rules, ordered by priority
    const salaryRules = await prisma.salaryRule.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" },
    });

    // Get work logs for the period
    const workLogs = await prisma.workLog.findMany({
      where: {
        staffId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventType: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Get event staff records for additional context (e.g., isDriver)
    const eventStaffRecords = await prisma.eventStaff.findMany({
      where: {
        staffId,
        event: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
      include: {
        event: {
          select: {
            id: true,
            date: true,
          },
        },
      },
    });

    // Create a map for quick lookup of event staff data
    const eventStaffMap = new Map<string, typeof eventStaffRecords[0]>();
    for (const es of eventStaffRecords) {
      eventStaffMap.set(es.eventId, es);
    }

    let totalBaseSalary = 0;
    const allBonuses: BonusItem[] = [];
    const allDeductions: DeductionItem[] = [];
    const workLogDetails: WorkLogDetail[] = [];

    for (const log of workLogs) {
      const logDate = new Date(log.date);
      const dayOfWeek = logDate.getDay();
      const hours = Number(log.hours);
      const baseSalaryNum = Number(log.baseSalary);

      totalBaseSalary += baseSalaryNum;

      // Get event staff data for driver info
      const eventStaffData = log.eventId ? eventStaffMap.get(log.eventId) : null;
      const isDriver = eventStaffData?.isDriver ?? false;

      const context = {
        date: logDate,
        dayOfWeek,
        startTime: log.startTime,
        eventType: log.event?.eventType,
        hours,
        isDriver,
      };

      const logBonuses: BonusItem[] = [];

      // Evaluate each salary rule
      for (const rule of salaryRules) {
        const condition = rule.condition as SalaryRuleCondition;
        
        if (evaluateCondition(condition, context)) {
          const amount = calculateBonusAmount(
            rule.type,
            Number(rule.value),
            baseSalaryNum
          );

          const bonusItem: BonusItem = {
            ruleId: rule.id,
            ruleName: rule.name,
            type: rule.type,
            amount,
          };

          logBonuses.push(bonusItem);
          allBonuses.push(bonusItem);
        }
      }

      // Calculate deductions from existing log data
      const logDeductions: DeductionItem[] = [];
      const existingDeductions = Number(log.deductions || 0);
      if (existingDeductions > 0) {
        logDeductions.push({
          reason: "扣款",
          amount: existingDeductions,
        });
        allDeductions.push({
          reason: `${logDate.toISOString().split("T")[0]} 扣款`,
          amount: existingDeductions,
        });
      }

      const logBonusTotal = logBonuses.reduce((sum, b) => sum + b.amount, 0);
      const logDeductionTotal = logDeductions.reduce((sum, d) => sum + d.amount, 0);

      workLogDetails.push({
        id: log.id,
        date: logDate.toISOString().split("T")[0],
        eventId: log.eventId,
        eventName: log.event?.name ?? null,
        hours,
        baseSalary: baseSalaryNum,
        bonuses: logBonuses,
        deductions: logDeductions,
        totalForLog: baseSalaryNum + logBonusTotal - logDeductionTotal,
      });
    }

    // Aggregate bonuses by rule
    const aggregatedBonuses: BonusItem[] = [];
    const bonusByRule = new Map<string, BonusItem>();
    for (const bonus of allBonuses) {
      const existing = bonusByRule.get(bonus.ruleId);
      if (existing) {
        existing.amount += bonus.amount;
      } else {
        bonusByRule.set(bonus.ruleId, { ...bonus });
      }
    }
    aggregatedBonuses.push(...bonusByRule.values());

    const totalBonuses = aggregatedBonuses.reduce((sum, b) => sum + b.amount, 0);
    const totalDeductions = allDeductions.reduce((sum, d) => sum + d.amount, 0);
    const totalSalary = totalBaseSalary + totalBonuses - totalDeductions;

    return NextResponse.json({
      staffId,
      staffName: staff.name,
      period: { startDate, endDate },
      baseSalary: totalBaseSalary,
      bonuses: aggregatedBonuses,
      deductions: allDeductions,
      totalBonuses,
      totalDeductions,
      totalSalary,
      workLogCount: workLogs.length,
      details: workLogDetails,
    }, { status: 200 });
  } catch (error) {
    console.error("Error calculating salary:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden: Manager role required" }, { status: 403 });
    }

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
