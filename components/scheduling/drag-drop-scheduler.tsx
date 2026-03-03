'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

// Types
export type Skill = 'FRONT' | 'HOT' | 'BOTH';
export type WorkRole = 'FRONT' | 'HOT' | 'ASSISTANT';

export interface SchedulerStaff {
  id: string;
  name: string;
  skill: Skill;
  assignedEventsCount: number;
  maxEventsPerDay: number;
}

export interface AssignedStaff {
  id: string;
  staffId: string;
  name: string;
  workRole: WorkRole;
}

export interface SchedulerEvent {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  location: string;
  assignedStaff: AssignedStaff[];
}

export interface DragDropSchedulerProps {
  date: string;
  events: SchedulerEvent[];
  staff?: SchedulerStaff[];
  onStaffAssigned: (eventId: string, staffId: string, workRole: string) => Promise<void>;
  onStaffRemoved: (eventId: string, staffId: string) => Promise<void>;
}

// Labels
const skillLabels: Record<Skill, string> = {
  FRONT: '外場',
  HOT: '熱台',
  BOTH: '皆可',
};

const workRoleLabels: Record<WorkRole, string> = {
  FRONT: '外場',
  HOT: '熱台',
  ASSISTANT: '助手',
};

const skillColors: Record<Skill, { bg: string; text: string }> = {
  FRONT: { bg: '#dbeafe', text: '#1e40af' },
  HOT: { bg: '#fee2e2', text: '#991b1b' },
  BOTH: { bg: '#d1fae5', text: '#065f46' },
};

// Styles
const styles = {
  container: {
    display: 'flex',
    gap: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '500px',
  } as React.CSSProperties,
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  } as React.CSSProperties,
  leftPanel: {
    width: '280px',
    flexShrink: 0,
  } as React.CSSProperties,
  rightPanel: {
    flex: 1,
    minWidth: '400px',
  } as React.CSSProperties,
  panelHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  } as React.CSSProperties,
  panelTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  } as React.CSSProperties,
  panelContent: {
    padding: '16px',
    maxHeight: '600px',
    overflowY: 'auto' as const,
  } as React.CSSProperties,
  staffItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    marginBottom: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'grab',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  staffItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#f3f4f6',
  } as React.CSSProperties,
  staffItemDragging: {
    opacity: 0.8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transform: 'scale(1.02)',
  } as React.CSSProperties,
  staffName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
  } as React.CSSProperties,
  staffInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  skillBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
  countBadge: {
    fontSize: '11px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
  } as React.CSSProperties,
  eventCard: {
    marginBottom: '16px',
    backgroundColor: '#ffffff',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  eventCardOver: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  } as React.CSSProperties,
  eventHeader: {
    padding: '14px 16px',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  eventName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 4px 0',
  } as React.CSSProperties,
  eventDetails: {
    fontSize: '13px',
    color: '#6b7280',
  } as React.CSSProperties,
  eventBody: {
    padding: '14px 16px',
  } as React.CSSProperties,
  dropZone: {
    minHeight: '60px',
    border: '2px dashed #d1d5db',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    marginTop: '12px',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  dropZoneActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
  } as React.CSSProperties,
  assignedStaffContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  } as React.CSSProperties,
  assignedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '16px',
    fontSize: '13px',
    color: '#374151',
  } as React.CSSProperties,
  removeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    border: 'none',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '12px',
    lineHeight: 1,
    transition: 'all 0.2s',
  } as React.CSSProperties,
  rolePopup: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  rolePopupContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    minWidth: '300px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  rolePopupTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 16px 0',
  } as React.CSSProperties,
  roleButton: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    marginBottom: '8px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  } as React.CSSProperties,
  cancelButton: {
    marginTop: '8px',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#f3f4f6',
    fontSize: '14px',
    color: '#6b7280',
    cursor: 'pointer',
    width: '100%',
  } as React.CSSProperties,
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
  } as React.CSSProperties,
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  toast: {
    position: 'fixed' as const,
    bottom: '24px',
    right: '24px',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1100,
    animation: 'fadeIn 0.3s',
  } as React.CSSProperties,
  toastSuccess: {
    backgroundColor: '#10b981',
    color: '#ffffff',
  } as React.CSSProperties,
  toastError: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#9ca3af',
    fontSize: '14px',
  } as React.CSSProperties,
};

// CSS keyframes injection
const injectStyles = () => {
  if (typeof document === 'undefined') return;
  const styleId = 'drag-drop-scheduler-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
};

// Draggable Staff Item Component
interface DraggableStaffProps {
  staff: SchedulerStaff;
  isDisabled: boolean;
}

function DraggableStaff({ staff, isDisabled }: DraggableStaffProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `staff-${staff.id}`,
    data: { staff },
    disabled: isDisabled,
  });

  const skillColor = skillColors[staff.skill];
  const itemStyle: React.CSSProperties = {
    ...styles.staffItem,
    ...(isDisabled ? styles.staffItemDisabled : {}),
    ...(isDragging ? styles.staffItemDragging : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={itemStyle}
      {...(isDisabled ? {} : { ...listeners, ...attributes })}
    >
      <div>
        <div style={styles.staffName}>{staff.name}</div>
        <div style={styles.staffInfo}>
          <span
            style={{
              ...styles.skillBadge,
              backgroundColor: skillColor.bg,
              color: skillColor.text,
            }}
          >
            {skillLabels[staff.skill]}
          </span>
          <span style={styles.countBadge}>
            已排 {staff.assignedEventsCount} 場
          </span>
        </div>
      </div>
    </div>
  );
}

// Droppable Event Card Component
interface DroppableEventProps {
  event: SchedulerEvent;
  isLoading: boolean;
  loadingStaffId: string | null;
  onRemoveStaff: (staffId: string) => void;
}

function DroppableEvent({ event, isLoading, loadingStaffId, onRemoveStaff }: DroppableEventProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `event-${event.id}`,
    data: { event },
  });

  const cardStyle: React.CSSProperties = {
    ...styles.eventCard,
    ...(isOver ? styles.eventCardOver : {}),
    position: 'relative',
  };

  const dropZoneStyle: React.CSSProperties = {
    ...styles.dropZone,
    ...(isOver ? styles.dropZoneActive : {}),
  };

  return (
    <div ref={setNodeRef} style={cardStyle}>
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner} />
        </div>
      )}
      <div style={styles.eventHeader}>
        <h4 style={styles.eventName}>{event.name}</h4>
        <div style={styles.eventDetails}>
          {event.startTime} - {event.endTime} · {event.location}
        </div>
      </div>
      <div style={styles.eventBody}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
          已指派人員 ({event.assignedStaff.length})
        </div>
        {event.assignedStaff.length > 0 ? (
          <div style={styles.assignedStaffContainer}>
            {event.assignedStaff.map((assigned) => (
              <div key={assigned.id} style={styles.assignedBadge}>
                <span>{assigned.name}</span>
                <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                  {workRoleLabels[assigned.workRole]}
                </span>
                <button
                  style={styles.removeButton}
                  onClick={() => onRemoveStaff(assigned.staffId)}
                  disabled={loadingStaffId === assigned.staffId}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: '13px' }}>尚未指派人員</div>
        )}
        <div style={dropZoneStyle}>
          {isOver ? '放開以指派人員' : '拖曳人員到此處'}
        </div>
      </div>
    </div>
  );
}

// Work Role Selection Popup
interface RoleSelectionPopupProps {
  staffName: string;
  defaultRole: WorkRole;
  onSelect: (role: WorkRole) => void;
  onCancel: () => void;
}

function RoleSelectionPopup({ staffName, defaultRole, onSelect, onCancel }: RoleSelectionPopupProps) {
  const roles: WorkRole[] = ['FRONT', 'HOT', 'ASSISTANT'];

  return (
    <div style={styles.rolePopup} onClick={onCancel}>
      <div style={styles.rolePopupContent} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.rolePopupTitle}>
          選擇 {staffName} 的工作角色
        </h3>
        {roles.map((role) => (
          <button
            key={role}
            style={{
              ...styles.roleButton,
              ...(role === defaultRole
                ? { backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#1e40af' }
                : {}),
            }}
            onClick={() => onSelect(role)}
            onMouseOver={(e) => {
              if (role !== defaultRole) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }
            }}
            onMouseOut={(e) => {
              if (role !== defaultRole) {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }
            }}
          >
            {workRoleLabels[role]}
            {role === defaultRole && (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>
                (建議)
              </span>
            )}
          </button>
        ))}
        <button style={styles.cancelButton} onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}

// Toast Component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        ...styles.toast,
        ...(type === 'success' ? styles.toastSuccess : styles.toastError),
      }}
    >
      {message}
    </div>
  );
}

// Main Component
export function DragDropScheduler({
  date,
  events,
  staff = [],
  onStaffAssigned,
  onStaffRemoved,
}: DragDropSchedulerProps) {
  const [activeStaff, setActiveStaff] = useState<SchedulerStaff | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<{
    eventId: string;
    staff: SchedulerStaff;
  } | null>(null);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [loadingStaffId, setLoadingStaffId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    injectStyles();
  }, []);

  const getDefaultRole = useCallback((skill: Skill): WorkRole => {
    switch (skill) {
      case 'FRONT':
        return 'FRONT';
      case 'HOT':
        return 'HOT';
      case 'BOTH':
        return 'FRONT';
      default:
        return 'FRONT';
    }
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { staff } = event.active.data.current as { staff: SchedulerStaff };
    setActiveStaff(staff);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveStaff(null);

    const { active, over } = event;
    if (!over) return;

    const staffData = active.data.current as { staff: SchedulerStaff };
    const eventData = over.data.current as { event: SchedulerEvent } | undefined;

    if (!eventData?.event) return;

    // Check if staff is already assigned to this event
    const isAlreadyAssigned = eventData.event.assignedStaff.some(
      (s) => s.staffId === staffData.staff.id
    );

    if (isAlreadyAssigned) {
      setToast({ message: '此人員已指派到該活動', type: 'error' });
      return;
    }

    // Show role selection popup
    setPendingAssignment({
      eventId: eventData.event.id,
      staff: staffData.staff,
    });
  }, []);

  const handleRoleSelect = useCallback(
    async (role: WorkRole) => {
      if (!pendingAssignment) return;

      const { eventId, staff: assignedStaff } = pendingAssignment;
      setPendingAssignment(null);
      setLoadingEventId(eventId);

      try {
        await onStaffAssigned(eventId, assignedStaff.id, role);
        setToast({ message: `已成功指派 ${assignedStaff.name}`, type: 'success' });
      } catch (error) {
        setToast({
          message: `指派失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
          type: 'error',
        });
      } finally {
        setLoadingEventId(null);
      }
    },
    [pendingAssignment, onStaffAssigned]
  );

  const handleCancelRoleSelection = useCallback(() => {
    setPendingAssignment(null);
  }, []);

  const handleRemoveStaff = useCallback(
    async (eventId: string, staffId: string) => {
      setLoadingEventId(eventId);
      setLoadingStaffId(staffId);

      try {
        await onStaffRemoved(eventId, staffId);
        setToast({ message: '已移除人員', type: 'success' });
      } catch (error) {
        setToast({
          message: `移除失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
          type: 'error',
        });
      } finally {
        setLoadingEventId(null);
        setLoadingStaffId(null);
      }
    },
    [onStaffRemoved]
  );

  const formattedDate = new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={styles.container}>
        {/* Left Panel - Staff List */}
        <div style={{ ...styles.panel, ...styles.leftPanel }}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>可用人員</h3>
          </div>
          <div style={styles.panelContent}>
            {staff.length === 0 ? (
              <div style={styles.emptyState}>暫無可用人員</div>
            ) : (
              staff.map((s) => {
                const isMaxed = s.assignedEventsCount >= s.maxEventsPerDay;
                return (
                  <DraggableStaff key={s.id} staff={s} isDisabled={isMaxed} />
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Events */}
        <div style={{ ...styles.panel, ...styles.rightPanel }}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>{formattedDate} 活動</h3>
          </div>
          <div style={styles.panelContent}>
            {events.length === 0 ? (
              <div style={styles.emptyState}>今日無活動</div>
            ) : (
              events.map((event) => (
                <DroppableEvent
                  key={event.id}
                  event={event}
                  isLoading={loadingEventId === event.id}
                  loadingStaffId={loadingStaffId}
                  onRemoveStaff={(staffId) => handleRemoveStaff(event.id, staffId)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeStaff && (
          <div
            style={{
              ...styles.staffItem,
              ...styles.staffItemDragging,
              backgroundColor: '#ffffff',
            }}
          >
            <div>
              <div style={styles.staffName}>{activeStaff.name}</div>
              <div style={styles.staffInfo}>
                <span
                  style={{
                    ...styles.skillBadge,
                    backgroundColor: skillColors[activeStaff.skill].bg,
                    color: skillColors[activeStaff.skill].text,
                  }}
                >
                  {skillLabels[activeStaff.skill]}
                </span>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>

      {/* Role Selection Popup */}
      {pendingAssignment && (
        <RoleSelectionPopup
          staffName={pendingAssignment.staff.name}
          defaultRole={getDefaultRole(pendingAssignment.staff.skill)}
          onSelect={handleRoleSelect}
          onCancel={handleCancelRoleSelection}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DndContext>
  );
}

export default DragDropScheduler;
