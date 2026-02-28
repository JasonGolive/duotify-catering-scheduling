# Feature Specification: Staff Scheduling Module

**Feature Branch**: `003-staff-scheduling`  
**Created**: 2026-02-28  
**Status**: Draft

## Overview

建立人員排班模組，用於將員工指派到活動場次，管理出勤確認與薪資計算。

## User Stories

### User Story 1 - 活動人員指派 (Priority: P1)

管理者需要為每個活動指派工作人員。

**Acceptance Scenarios**:
1. 在活動詳情頁面可新增/移除人員
2. 指派人員時可選擇工作角色（外場/熱台/皆可）
3. 顯示員工目前的技能與單場薪資
4. 同一員工不可重複指派到同一活動

### User Story 2 - 排班衝突檢查 (Priority: P1)

系統需要檢查員工是否有時間衝突。

**Acceptance Scenarios**:
1. 指派員工時檢查當天是否已有其他活動
2. 有衝突時顯示警告但仍可強制指派
3. 列表顯示衝突狀態標記

### User Story 3 - 出勤確認 (Priority: P2)

管理者需要記錄員工實際出勤狀況。

**Acceptance Scenarios**:
1. 可標記員工為「已出勤」、「缺勤」、「遲到」
2. 可記錄實際工作時數
3. 出勤資料影響薪資計算

### User Story 4 - 薪資計算與報表 (Priority: P2)

管理者需要查看員工薪資。

**Acceptance Scenarios**:
1. 依員工單場薪資計算應付金額
2. 依出勤狀態調整薪資（缺勤=0、遲到可調整）
3. 可匯出月報表

## Data Model

### EventStaff Entity (中間表)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (CUID) | ✓ | 唯一識別碼 |
| eventId | String | ✓ | 活動 ID (FK) |
| staffId | String | ✓ | 員工 ID (FK) |
| role | Enum | ✓ | 工作角色 |
| salary | Decimal | ✓ | 該場薪資 (複製自員工設定) |
| attendanceStatus | Enum | | 出勤狀態 |
| actualHours | Decimal | | 實際工作時數 |
| adjustedSalary | Decimal | | 調整後薪資 |
| notes | Text | | 備註 |
| createdAt | DateTime | ✓ | 建立時間 |
| updatedAt | DateTime | ✓ | 更新時間 |

### Enums

**WorkRole** (工作角色):
- FRONT (外場)
- KITCHEN (熱台)
- BOTH (皆可)

**AttendanceStatus** (出勤狀態):
- SCHEDULED (已排班)
- CONFIRMED (已確認出勤)
- ATTENDED (已出勤)
- LATE (遲到)
- ABSENT (缺勤)
- CANCELLED (取消)

## API Endpoints

- `GET /api/v1/events/[id]/staff` - 取得活動的人員列表
- `POST /api/v1/events/[id]/staff` - 新增人員到活動
- `PUT /api/v1/events/[id]/staff/[staffId]` - 更新人員資訊（出勤、薪資等）
- `DELETE /api/v1/events/[id]/staff/[staffId]` - 從活動移除人員
- `GET /api/v1/staff/[id]/schedule` - 取得員工的排班行事曆
- `GET /api/v1/reports/salary` - 薪資報表

## UI Pages

- `/events/[id]` - 活動詳情頁（加入人員管理區塊）
- `/events/[id]/staff` - 活動人員管理頁面
- `/staff/[id]/schedule` - 員工排班行事曆
- `/reports/salary` - 薪資報表頁面

## Business Rules

1. **薪資複製**: 指派員工時，將員工的 perEventSalary 複製到 EventStaff.salary
2. **衝突定義**: 同一天有多個活動時視為衝突
3. **薪資計算**:
   - ATTENDED: 全額
   - LATE: 可手動調整
   - ABSENT: 0
   - CANCELLED: 0

## Success Criteria

- 管理者可在 30 秒內完成人員指派
- 衝突檢查即時回應（< 500ms）
- 薪資報表可在 3 秒內產生
