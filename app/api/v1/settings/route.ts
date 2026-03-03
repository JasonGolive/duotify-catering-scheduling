import { NextRequest, NextResponse } from "next/server";

// In-memory settings store (can be extended to use database or environment variables)
// For production, consider storing in database or using a Settings model
let schedulingSettings = {
  maxEventsPerDay: parseInt(process.env.MAX_EVENTS_PER_DAY || "2", 10),
  defaultEventDurationHours: parseInt(process.env.DEFAULT_EVENT_DURATION_HOURS || "4", 10),
  enableTimeOverlapCheck: process.env.ENABLE_TIME_OVERLAP_CHECK !== "false",
  bufferMinutesBetweenEvents: parseInt(process.env.BUFFER_MINUTES_BETWEEN_EVENTS || "0", 10),
};

/**
 * GET /api/v1/settings
 * Retrieve current scheduling settings
 */
export async function GET() {
  try {
    return NextResponse.json({
      scheduling: schedulingSettings,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "無法取得設定" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/settings
 * Update scheduling settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate and update settings
    if (body.scheduling) {
      const { scheduling } = body;
      
      if (typeof scheduling.maxEventsPerDay === "number" && scheduling.maxEventsPerDay > 0) {
        schedulingSettings.maxEventsPerDay = scheduling.maxEventsPerDay;
      }
      
      if (typeof scheduling.defaultEventDurationHours === "number" && scheduling.defaultEventDurationHours > 0) {
        schedulingSettings.defaultEventDurationHours = scheduling.defaultEventDurationHours;
      }
      
      if (typeof scheduling.enableTimeOverlapCheck === "boolean") {
        schedulingSettings.enableTimeOverlapCheck = scheduling.enableTimeOverlapCheck;
      }
      
      if (typeof scheduling.bufferMinutesBetweenEvents === "number" && scheduling.bufferMinutesBetweenEvents >= 0) {
        schedulingSettings.bufferMinutesBetweenEvents = scheduling.bufferMinutesBetweenEvents;
      }
    }
    
    return NextResponse.json({
      message: "設定已更新",
      scheduling: schedulingSettings,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "無法更新設定" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/settings
 * Replace all scheduling settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.scheduling) {
      return NextResponse.json(
        { error: "scheduling 欄位為必填" },
        { status: 400 }
      );
    }
    
    const { scheduling } = body;
    
    // Validate all fields
    if (typeof scheduling.maxEventsPerDay !== "number" || scheduling.maxEventsPerDay <= 0) {
      return NextResponse.json(
        { error: "maxEventsPerDay 必須為正整數" },
        { status: 400 }
      );
    }
    
    if (typeof scheduling.defaultEventDurationHours !== "number" || scheduling.defaultEventDurationHours <= 0) {
      return NextResponse.json(
        { error: "defaultEventDurationHours 必須為正數" },
        { status: 400 }
      );
    }
    
    // Replace all settings
    schedulingSettings = {
      maxEventsPerDay: scheduling.maxEventsPerDay,
      defaultEventDurationHours: scheduling.defaultEventDurationHours,
      enableTimeOverlapCheck: scheduling.enableTimeOverlapCheck ?? true,
      bufferMinutesBetweenEvents: scheduling.bufferMinutesBetweenEvents ?? 0,
    };
    
    return NextResponse.json({
      message: "設定已完全更新",
      scheduling: schedulingSettings,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error replacing settings:", error);
    return NextResponse.json(
      { error: "無法更新設定" },
      { status: 500 }
    );
  }
}
