'use client';

import React, { useMemo } from 'react';

// Types
export type EventStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface EventStaff {
  id: string;
  name: string;
}

export interface CalendarEvent {
  id: string;
  name: string;
  date: Date | string;
  startTime: string;
  status: EventStatus;
  eventStaff: EventStaff[];
}

export type ViewMode = 'month' | 'week' | 'day';

export interface SchedulingCalendarProps {
  events: CalendarEvent[];
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onEventClick: (event: CalendarEvent) => void;
}

// Status colors
const statusColors: Record<EventStatus, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#92400e' },
  CONFIRMED: { bg: '#d1fae5', text: '#065f46' },
  IN_PROGRESS: { bg: '#dbeafe', text: '#1e40af' },
  COMPLETED: { bg: '#e5e7eb', text: '#374151' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
};

// Helper functions
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatWeekRange = (startDate: Date): string => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  return `${startDate.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}`;
};

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 to 22:00

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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  } as React.CSSProperties,
  headerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  } as React.CSSProperties,
  headerControls: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  } as React.CSSProperties,
  navButton: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  viewModeContainer: {
    display: 'flex',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    overflow: 'hidden',
  } as React.CSSProperties,
  viewModeButton: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    borderRight: '1px solid #d1d5db',
  } as React.CSSProperties,
  viewModeButtonActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  } as React.CSSProperties,
  viewModeButtonLast: {
    borderRight: 'none',
  } as React.CSSProperties,
  calendarBody: {
    padding: '16px',
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
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  } as React.CSSProperties,
  dayCell: {
    minHeight: '100px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    padding: '4px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
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
  dayNumber: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
    marginBottom: '4px',
  } as React.CSSProperties,
  dayNumberToday: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  eventItem: {
    padding: '4px 6px',
    marginBottom: '2px',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  eventName: {
    fontWeight: 500,
    marginRight: '4px',
  } as React.CSSProperties,
  eventTime: {
    fontSize: '10px',
    color: '#6b7280',
  } as React.CSSProperties,
  staffBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 500,
    marginLeft: '4px',
  } as React.CSSProperties,
  statusBadge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 500,
  } as React.CSSProperties,
  moreEventsButton: {
    fontSize: '11px',
    color: '#3b82f6',
    padding: '2px 4px',
    cursor: 'pointer',
    fontWeight: 500,
  } as React.CSSProperties,
  weekViewContainer: {
    display: 'grid',
    gridTemplateColumns: '60px repeat(7, 1fr)',
    gap: '1px',
    backgroundColor: '#e5e7eb',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  } as React.CSSProperties,
  weekViewHeader: {
    display: 'contents',
  } as React.CSSProperties,
  weekViewHeaderCell: {
    padding: '12px 8px',
    textAlign: 'center' as const,
    backgroundColor: '#f9fafb',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
  } as React.CSSProperties,
  weekViewHeaderCellToday: {
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
  } as React.CSSProperties,
  timeColumn: {
    backgroundColor: '#f9fafb',
  } as React.CSSProperties,
  timeSlot: {
    padding: '4px 8px',
    fontSize: '11px',
    color: '#6b7280',
    textAlign: 'right' as const,
    height: '60px',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  weekDayColumn: {
    backgroundColor: '#ffffff',
    position: 'relative' as const,
  } as React.CSSProperties,
  weekDaySlot: {
    height: '60px',
    borderBottom: '1px solid #f3f4f6',
    position: 'relative' as const,
  } as React.CSSProperties,
  weekEvent: {
    position: 'absolute' as const,
    left: '2px',
    right: '2px',
    padding: '4px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    overflow: 'hidden',
    cursor: 'pointer',
    zIndex: 1,
  } as React.CSSProperties,
  dayViewContainer: {
    backgroundColor: '#ffffff',
  } as React.CSSProperties,
  dayViewEventList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  } as React.CSSProperties,
  dayViewEventCard: {
    display: 'flex',
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    gap: '16px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  } as React.CSSProperties,
  dayViewEventTime: {
    minWidth: '80px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  } as React.CSSProperties,
  dayViewEventDetails: {
    flex: 1,
  } as React.CSSProperties,
  dayViewEventName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '8px',
  } as React.CSSProperties,
  dayViewEventMeta: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  emptyState: {
    padding: '40px',
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '14px',
  } as React.CSSProperties,
};

// Event Item Component
interface EventItemProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick: () => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, compact = false, onClick }) => {
  const statusStyle = statusColors[event.status];
  const hasStaff = event.eventStaff && event.eventStaff.length > 0;

  return (
    <div
      style={{
        ...styles.eventItem,
        backgroundColor: statusStyle.bg,
        color: statusStyle.text,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={event.name}
    >
      <span style={styles.eventName}>
        {compact && event.name.length > 10 ? `${event.name.slice(0, 10)}...` : event.name}
      </span>
      {!compact && <span style={styles.eventTime}>{event.startTime}</span>}
      <span
        style={{
          ...styles.staffBadge,
          backgroundColor: hasStaff ? '#d1fae5' : '#fee2e2',
          color: hasStaff ? '#065f46' : '#991b1b',
        }}
      >
        {event.eventStaff?.length || 0} 人
      </span>
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: EventStatus }> = ({ status }) => {
  const statusStyle = statusColors[status];
  const statusLabels: Record<EventStatus, string> = {
    PENDING: '待確認',
    CONFIRMED: '已確認',
    IN_PROGRESS: '進行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };

  return (
    <span
      style={{
        ...styles.statusBadge,
        backgroundColor: statusStyle.bg,
        color: statusStyle.text,
      }}
    >
      {statusLabels[status]}
    </span>
  );
};

// Month View Component
interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate, events, onEventClick, onDateChange }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarDays = useMemo(() => {
    const startOfMonth = getStartOfMonth(currentDate);
    const endOfMonth = getEndOfMonth(currentDate);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  return (
    <div>
      <div style={styles.weekdayHeader}>
        {WEEKDAYS.map((day) => (
          <div key={day} style={styles.weekdayCell}>
            {day}
          </div>
        ))}
      </div>
      <div style={styles.monthGrid}>
        {calendarDays.map(({ date, isCurrentMonth }, index) => {
          const dayEvents = getEventsForDay(date);
          const isToday = isSameDay(date, today);

          return (
            <div
              key={index}
              style={{
                ...styles.dayCell,
                ...(isToday ? styles.dayCellToday : {}),
                ...(!isCurrentMonth ? styles.dayCellOtherMonth : {}),
              }}
              onClick={() => onDateChange(date)}
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
                <EventItem
                  key={event.id}
                  event={event}
                  compact
                  onClick={() => onEventClick(event)}
                />
              ))}
              {dayEvents.length > 2 && (
                <div style={styles.moreEventsButton}>+{dayEvents.length - 2} 更多</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Week View Component
interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, onEventClick }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = useMemo(() => {
    const startOfWeek = getStartOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [currentDate]);

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const getEventPosition = (event: CalendarEvent): { top: number; height: number } => {
    const minutes = parseTimeToMinutes(event.startTime);
    const startMinutes = 6 * 60; // 6:00
    const top = ((minutes - startMinutes) / 60) * 60; // 60px per hour
    return { top: Math.max(0, top), height: 50 };
  };

  return (
    <div style={styles.weekViewContainer}>
      {/* Header row */}
      <div style={styles.weekViewHeaderCell}></div>
      {weekDays.map((date, index) => {
        const isToday = isSameDay(date, today);
        return (
          <div
            key={index}
            style={{
              ...styles.weekViewHeaderCell,
              ...(isToday ? styles.weekViewHeaderCellToday : {}),
            }}
          >
            <div>{WEEKDAYS[date.getDay()]}</div>
            <div style={{ fontSize: '16px', marginTop: '4px' }}>{date.getDate()}</div>
          </div>
        );
      })}

      {/* Time slots */}
      {TIME_SLOTS.map((hour) => (
        <React.Fragment key={hour}>
          <div style={{ ...styles.timeSlot, ...styles.timeColumn }}>
            {hour.toString().padStart(2, '0')}:00
          </div>
          {weekDays.map((date, dayIndex) => {
            const dayEvents = hour === 6 ? getEventsForDay(date) : [];
            return (
              <div
                key={dayIndex}
                style={{
                  ...styles.weekDaySlot,
                  position: hour === 6 ? 'relative' : 'static',
                }}
              >
                {hour === 6 &&
                  dayEvents.map((event) => {
                    const pos = getEventPosition(event);
                    const statusStyle = statusColors[event.status];
                    const hasStaff = event.eventStaff && event.eventStaff.length > 0;
                    return (
                      <div
                        key={event.id}
                        style={{
                          ...styles.weekEvent,
                          top: `${pos.top}px`,
                          height: `${pos.height}px`,
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          borderLeft: `3px solid ${statusStyle.text}`,
                        }}
                        onClick={() => onEventClick(event)}
                        title={`${event.name} - ${event.startTime}`}
                      >
                        <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                          {event.name.length > 12 ? `${event.name.slice(0, 12)}...` : event.name}
                        </div>
                        <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{event.startTime}</span>
                          <span
                            style={{
                              backgroundColor: hasStaff ? '#d1fae5' : '#fee2e2',
                              color: hasStaff ? '#065f46' : '#991b1b',
                              padding: '1px 4px',
                              borderRadius: '4px',
                            }}
                          >
                            {event.eventStaff?.length || 0}人
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

// Day View Component
interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const DayView: React.FC<DayViewProps> = ({ currentDate, events, onEventClick }) => {
  const dayEvents = useMemo(() => {
    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return isSameDay(eventDate, currentDate);
      })
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  }, [events, currentDate]);

  if (dayEvents.length === 0) {
    return <div style={styles.emptyState}>今天沒有活動</div>;
  }

  return (
    <div style={styles.dayViewContainer}>
      <div style={styles.dayViewEventList}>
        {dayEvents.map((event) => {
          const hasStaff = event.eventStaff && event.eventStaff.length > 0;
          return (
            <div
              key={event.id}
              style={styles.dayViewEventCard}
              onClick={() => onEventClick(event)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={styles.dayViewEventTime}>{event.startTime}</div>
              <div style={styles.dayViewEventDetails}>
                <div style={styles.dayViewEventName}>{event.name}</div>
                <div style={styles.dayViewEventMeta}>
                  <StatusBadge status={event.status} />
                  <span
                    style={{
                      ...styles.staffBadge,
                      backgroundColor: hasStaff ? '#d1fae5' : '#fee2e2',
                      color: hasStaff ? '#065f46' : '#991b1b',
                      fontSize: '12px',
                      padding: '4px 8px',
                    }}
                  >
                    工作人員: {event.eventStaff?.length || 0} 人
                  </span>
                  {event.eventStaff && event.eventStaff.length > 0 && (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      ({event.eventStaff.map((s) => s.name).join(', ')})
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Calendar Component
export const SchedulingCalendar: React.FC<SchedulingCalendarProps> = ({
  events,
  currentDate,
  viewMode,
  onDateChange,
  onViewModeChange,
  onEventClick,
}) => {
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getHeaderTitle = (): string => {
    switch (viewMode) {
      case 'month':
        return currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
      case 'week':
        return formatWeekRange(getStartOfWeek(currentDate));
      case 'day':
        return formatDate(currentDate);
    }
  };

  const viewModes: ViewMode[] = ['month', 'week', 'day'];
  const viewModeLabels: Record<ViewMode, string> = {
    month: '月',
    week: '週',
    day: '日',
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerControls}>
          <button
            style={styles.navButton}
            onClick={handleToday}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#ffffff';
            }}
          >
            今天
          </button>
          <button
            style={styles.navButton}
            onClick={handlePrevious}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#ffffff';
            }}
          >
            ◀
          </button>
          <button
            style={styles.navButton}
            onClick={handleNext}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#ffffff';
            }}
          >
            ▶
          </button>
          <h2 style={styles.headerTitle}>{getHeaderTitle()}</h2>
        </div>
        <div style={styles.viewModeContainer}>
          {viewModes.map((mode, index) => (
            <button
              key={mode}
              style={{
                ...styles.viewModeButton,
                ...(viewMode === mode ? styles.viewModeButtonActive : {}),
                ...(index === viewModes.length - 1 ? styles.viewModeButtonLast : {}),
              }}
              onClick={() => onViewModeChange(mode)}
            >
              {viewModeLabels[mode]}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.calendarBody}>
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
            onDateChange={onDateChange}
          />
        )}
        {viewMode === 'week' && (
          <WeekView currentDate={currentDate} events={events} onEventClick={onEventClick} />
        )}
        {viewMode === 'day' && (
          <DayView currentDate={currentDate} events={events} onEventClick={onEventClick} />
        )}
      </div>
    </div>
  );
};

export default SchedulingCalendar;
