'use client';

import React, { useState, useEffect, useMemo } from 'react';

// Types
export interface Staff {
  id: string;
  name: string;
  phone: string;
  skill: 'FRONT' | 'HOT' | 'BOTH';
}

export interface StaffScheduleEvent {
  id: string;
  eventId: string;
  eventName: string;
  date: Date | string;
  role: 'FRONT' | 'HOT' | 'BOTH';
  vehicle: 'BIG_TRUCK' | 'SMALL_TRUCK' | 'MANAGER_CAR' | 'OWN_CAR' | null;
  isDriver: boolean;
  attendanceStatus: 'SCHEDULED' | 'CONFIRMED' | 'ATTENDED' | 'LATE' | 'ABSENT' | 'CANCELLED';
  notified: boolean;
  notifiedAt: string | null;
}

export interface StaffScheduleViewProps {
  staffId?: string;
  month: number; // 0-11
  year: number;
}

// Labels
const roleLabels: Record<string, string> = {
  FRONT: '外場',
  HOT: '熱台',
  BOTH: '皆可',
};

const vehicleLabels: Record<string, string> = {
  BIG_TRUCK: '大餐車',
  SMALL_TRUCK: '小餐車',
  MANAGER_CAR: '店長車',
  OWN_CAR: '自備車',
};

const attendanceLabels: Record<string, string> = {
  SCHEDULED: '已排班',
  CONFIRMED: '已確認',
  ATTENDED: '已出勤',
  LATE: '遲到',
  ABSENT: '缺勤',
  CANCELLED: '取消',
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// Styles
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  } as React.CSSProperties,
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  } as React.CSSProperties,
  headerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 12px 0',
  } as React.CSSProperties,
  dropdownContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  } as React.CSSProperties,
  select: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    minWidth: '200px',
  } as React.CSSProperties,
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  statCard: {
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  } as React.CSSProperties,
  statTitle: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
  } as React.CSSProperties,
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  statBreakdown: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#6b7280',
  } as React.CSSProperties,
  calendarContainer: {
    padding: '16px 20px',
  } as React.CSSProperties,
  monthHeader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  } as React.CSSProperties,
  weekdayHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '8px',
  } as React.CSSProperties,
  weekdayCell: {
    textAlign: 'center' as const,
    padding: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
  } as React.CSSProperties,
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  } as React.CSSProperties,
  dayCell: {
    minHeight: '80px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    padding: '4px',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  } as React.CSSProperties,
  dayCellToday: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  } as React.CSSProperties,
  dayCellOtherMonth: {
    backgroundColor: '#f9fafb',
    opacity: 0.5,
  } as React.CSSProperties,
  dayCellHasEvent: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  } as React.CSSProperties,
  dayNumber: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#111827',
    marginBottom: '2px',
  } as React.CSSProperties,
  dayNumberToday: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
  } as React.CSSProperties,
  eventDot: {
    width: '100%',
    padding: '2px 4px',
    marginBottom: '2px',
    borderRadius: '3px',
    fontSize: '10px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  listContainer: {
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
  } as React.CSSProperties,
  listTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '16px',
  } as React.CSSProperties,
  eventListItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    gap: '16px',
  } as React.CSSProperties,
  eventDate: {
    minWidth: '100px',
  } as React.CSSProperties,
  eventDateDay: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  } as React.CSSProperties,
  eventDateWeekday: {
    fontSize: '12px',
    color: '#6b7280',
  } as React.CSSProperties,
  eventDetails: {
    flex: 1,
  } as React.CSSProperties,
  eventName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '4px',
  } as React.CSSProperties,
  eventMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    fontSize: '12px',
    color: '#6b7280',
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
  } as React.CSSProperties,
  roleBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  } as React.CSSProperties,
  vehicleBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  } as React.CSSProperties,
  notifiedBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  } as React.CSSProperties,
  notNotifiedBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  } as React.CSSProperties,
  emptyState: {
    padding: '40px',
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '14px',
  } as React.CSSProperties,
  loading: {
    padding: '40px',
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '14px',
  } as React.CSSProperties,
  error: {
    padding: '16px 20px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '6px',
    margin: '16px 20px',
    fontSize: '14px',
  } as React.CSSProperties,
};

// Helper functions
const getStartOfMonth = (year: number, month: number): Date => {
  return new Date(year, month, 1);
};

const getEndOfMonth = (year: number, month: number): Date => {
  return new Date(year, month + 1, 0);
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const StaffScheduleView: React.FC<StaffScheduleViewProps> = ({
  staffId: propStaffId,
  month,
  year,
}) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(propStaffId);
  const [events, setEvents] = useState<StaffScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch staff list
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const res = await fetch('/api/v1/staff?status=ACTIVE');
        if (!res.ok) throw new Error('無法載入員工列表');
        const data = await res.json();
        setStaffList(data.staff || []);
        
        // If propStaffId provided, use it; otherwise select first staff
        if (propStaffId) {
          setSelectedStaffId(propStaffId);
        } else if (data.staff && data.staff.length > 0 && !selectedStaffId) {
          setSelectedStaffId(data.staff[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗');
      }
    };
    fetchStaffList();
  }, [propStaffId]);

  // Fetch events for selected staff
  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedStaffId) {
        setEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const startDate = formatDateForAPI(getStartOfMonth(year, month));
        const endDate = formatDateForAPI(getEndOfMonth(year, month));

        const res = await fetch(
          `/api/v1/reports/scheduling?staffId=${selectedStaffId}&startDate=${startDate}&endDate=${endDate}`
        );

        if (!res.ok) throw new Error('無法載入排班資料');
        
        const data = await res.json();
        
        // Transform the response data to StaffScheduleEvent format
        // The API returns staffStats which we need to convert
        const transformedEvents: StaffScheduleEvent[] = [];
        
        // We need to fetch the actual event assignments for this staff member
        // Since the scheduling report doesn't return individual events, 
        // we'll make an additional request to get events
        const eventsRes = await fetch(
          `/api/v1/availability?staffId=${selectedStaffId}&startDate=${startDate}&endDate=${endDate}`
        );
        
        // Since availability API might not return events, let's fetch differently
        // We need to get events where this staff is assigned
        // For now, construct from the report data structure
        
        setEvents(transformedEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入排班資料失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedStaffId, month, year]);

  // Actually fetch event staff assignments directly
  useEffect(() => {
    const fetchStaffEvents = async () => {
      if (!selectedStaffId) {
        setEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const startDate = formatDateForAPI(getStartOfMonth(year, month));
        const endDate = formatDateForAPI(getEndOfMonth(year, month));

        // Fetch scheduling report which includes event assignments
        const res = await fetch(
          `/api/v1/reports/scheduling?staffId=${selectedStaffId}&startDate=${startDate}&endDate=${endDate}`
        );

        if (!res.ok) throw new Error('無法載入排班資料');
        
        const reportData = await res.json();
        
        // Also fetch events to get detailed event info
        const eventsRes = await fetch(
          `/api/v1/reports/events?startDate=${startDate}&endDate=${endDate}`
        );
        
        let eventsList: StaffScheduleEvent[] = [];
        
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const allEvents = eventsData.events || [];
          
          // Filter events where this staff is assigned
          for (const event of allEvents) {
            const staffAssignment = event.eventStaff?.find(
              (es: { staffId: string }) => es.staffId === selectedStaffId
            );
            
            if (staffAssignment) {
              eventsList.push({
                id: staffAssignment.id || `${event.id}-${selectedStaffId}`,
                eventId: event.id,
                eventName: event.name,
                date: event.date,
                role: staffAssignment.role || 'FRONT',
                vehicle: staffAssignment.vehicle || null,
                isDriver: staffAssignment.isDriver || false,
                attendanceStatus: staffAssignment.attendanceStatus || 'SCHEDULED',
                notified: staffAssignment.notified || false,
                notifiedAt: staffAssignment.notifiedAt || null,
              });
            }
          }
        }
        
        // Sort by date
        eventsList.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        setEvents(eventsList);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入排班資料失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffEvents();
  }, [selectedStaffId, month, year]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const eventsByRole: Record<string, number> = { FRONT: 0, HOT: 0, BOTH: 0 };
    const eventsByVehicle: Record<string, number> = {
      BIG_TRUCK: 0,
      SMALL_TRUCK: 0,
      MANAGER_CAR: 0,
      OWN_CAR: 0,
      UNASSIGNED: 0,
    };

    for (const event of events) {
      if (eventsByRole[event.role] !== undefined) {
        eventsByRole[event.role]++;
      }
      const vehicleKey = event.vehicle || 'UNASSIGNED';
      if (eventsByVehicle[vehicleKey] !== undefined) {
        eventsByVehicle[vehicleKey]++;
      }
    }

    return { totalEvents, eventsByRole, eventsByVehicle };
  }, [events]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const startOfMonth = getStartOfMonth(year, month);
    const endOfMonth = getEndOfMonth(year, month);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill 6 rows
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const getEventsForDay = (date: Date): StaffScheduleEvent[] => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedStaff = staffList.find(s => s.id === selectedStaffId);
  const monthName = new Date(year, month).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });

  return (
    <div style={styles.container}>
      {/* Header with staff selector */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>人員檢視 - 排班表</h2>
        <div style={styles.dropdownContainer}>
          <label style={styles.label}>選擇員工：</label>
          <select
            style={styles.select}
            value={selectedStaffId || ''}
            onChange={(e) => setSelectedStaffId(e.target.value || undefined)}
          >
            <option value="">請選擇員工</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} ({roleLabels[staff.skill]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {selectedStaffId && !loading && (
        <>
          {/* Summary Stats */}
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <div style={styles.statTitle}>本月活動總數</div>
              <div style={styles.statValue}>{stats.totalEvents}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statTitle}>依角色分佈</div>
              <div style={styles.statBreakdown}>
                {Object.entries(stats.eventsByRole)
                  .filter(([_, count]) => count > 0)
                  .map(([role, count]) => (
                    <div key={role}>
                      {roleLabels[role] || role}: {count} 場
                    </div>
                  ))}
                {Object.values(stats.eventsByRole).every(v => v === 0) && (
                  <div>無資料</div>
                )}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statTitle}>依車輛分佈</div>
              <div style={styles.statBreakdown}>
                {Object.entries(stats.eventsByVehicle)
                  .filter(([_, count]) => count > 0)
                  .map(([vehicle, count]) => (
                    <div key={vehicle}>
                      {vehicleLabels[vehicle] || (vehicle === 'UNASSIGNED' ? '未指定' : vehicle)}: {count} 場
                    </div>
                  ))}
                {Object.values(stats.eventsByVehicle).every(v => v === 0) && (
                  <div>無資料</div>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Calendar */}
          <div style={styles.calendarContainer}>
            <div style={styles.monthHeader}>{monthName}</div>
            <div style={styles.weekdayHeader}>
              {WEEKDAYS.map((day) => (
                <div key={day} style={styles.weekdayCell}>{day}</div>
              ))}
            </div>
            <div style={styles.monthGrid}>
              {calendarDays.map(({ date, isCurrentMonth }, index) => {
                const dayEvents = getEventsForDay(date);
                const isToday = isSameDay(date, today);
                const hasEvents = dayEvents.length > 0;

                return (
                  <div
                    key={index}
                    style={{
                      ...styles.dayCell,
                      ...(isToday ? styles.dayCellToday : {}),
                      ...(!isCurrentMonth ? styles.dayCellOtherMonth : {}),
                      ...(hasEvents && isCurrentMonth ? styles.dayCellHasEvent : {}),
                    }}
                  >
                    <div
                      style={{
                        ...styles.dayNumber,
                        ...(isToday ? styles.dayNumberToday : {}),
                      }}
                    >
                      {date.getDate()}
                    </div>
                    {dayEvents.slice(0, 2).map((event) => (
                      <div key={event.id} style={styles.eventDot} title={event.eventName}>
                        {event.eventName.length > 8 
                          ? `${event.eventName.slice(0, 8)}...` 
                          : event.eventName}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>
                        +{dayEvents.length - 2} 更多
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event List */}
          <div style={styles.listContainer}>
            <h3 style={styles.listTitle}>
              {selectedStaff?.name} 的排班列表 ({events.length} 場)
            </h3>
            {events.length === 0 ? (
              <div style={styles.emptyState}>本月無排班</div>
            ) : (
              events.map((event) => {
                const eventDate = new Date(event.date);
                return (
                  <div key={event.id} style={styles.eventListItem}>
                    <div style={styles.eventDate}>
                      <div style={styles.eventDateDay}>
                        {eventDate.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                      </div>
                      <div style={styles.eventDateWeekday}>
                        週{WEEKDAYS[eventDate.getDay()]}
                      </div>
                    </div>
                    <div style={styles.eventDetails}>
                      <div style={styles.eventName}>{event.eventName}</div>
                      <div style={styles.eventMeta}>
                        <span style={{ ...styles.badge, ...styles.roleBadge }}>
                          {roleLabels[event.role] || event.role}
                        </span>
                        {event.vehicle && (
                          <span style={{ ...styles.badge, ...styles.vehicleBadge }}>
                            {vehicleLabels[event.vehicle]}
                            {event.isDriver && ' (駕駛)'}
                          </span>
                        )}
                        <span
                          style={{
                            ...styles.badge,
                            ...(event.notified ? styles.notifiedBadge : styles.notNotifiedBadge),
                          }}
                        >
                          {event.notified ? '已通知' : '未通知'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          {attendanceLabels[event.attendanceStatus] || event.attendanceStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {!selectedStaffId && !loading && (
        <div style={styles.emptyState}>請選擇一位員工以查看排班</div>
      )}

      {loading && <div style={styles.loading}>載入中...</div>}
    </div>
  );
};

export default StaffScheduleView;
