# Feature Specification: Event Management Module

**Feature Branch**: `002-event-management`  
**Created**: 2026-02-24  
**Status**: Draft

## Overview

建立外燴活動管理模組，用於記錄和管理餐飲外燴服務的活動場次。

## User Stories

### User Story 1 - 檢視活動列表 (Priority: P1)

管理者需要快速查看所有活動場次的清單，包含日期、地點、狀態等資訊。

**Acceptance Scenarios**:
1. 管理者登入後可看到所有活動的列表
2. 列表顯示活動名稱、日期、地點、預計人數、狀態
3. 可按日期排序（預設為最近的在前）
4. 可按狀態篩選活動

### User Story 2 - 新增活動 (Priority: P1)

管理者需要建立新的外燴活動記錄。

**Acceptance Scenarios**:
1. 可填寫所有活動欄位
2. 必填欄位：活動名稱、日期、地點
3. 表單驗證錯誤時顯示明確訊息

### User Story 3 - 編輯活動 (Priority: P2)

管理者需要修改已建立的活動資訊。

**Acceptance Scenarios**:
1. 點擊活動可進入編輯頁面
2. 可修改所有欄位
3. 可變更活動狀態

## Data Model

### Event Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (CUID) | ✓ | 唯一識別碼 |
| name | String | ✓ | 活動名稱 |
| date | DateTime | ✓ | 活動日期 |
| startTime | String | | 開始時間 (HH:mm) |
| endTime | String | | 結束時間 (HH:mm) |
| location | String | ✓ | 活動地點 |
| address | String | | 詳細地址 |
| expectedGuests | Int | | 預計人數 |
| contactName | String | | 聯絡人姓名 |
| contactPhone | String | | 聯絡人電話 |
| eventType | Enum | | 活動類型 |
| notes | Text | | 備註 |
| status | Enum | ✓ | 活動狀態 |
| createdAt | DateTime | ✓ | 建立時間 |
| updatedAt | DateTime | ✓ | 更新時間 |

### Enums

**EventType**:
- WEDDING (婚宴)
- YEAREND (尾牙)
- SPRING (春酒)
- BIRTHDAY (生日宴)
- CORPORATE (企業活動)
- OTHER (其他)

**EventStatus**:
- PENDING (待確認)
- CONFIRMED (已確認)
- IN_PROGRESS (進行中)
- COMPLETED (已完成)
- CANCELLED (已取消)

## API Endpoints

- `GET /api/v1/events` - 取得活動列表
- `POST /api/v1/events` - 建立新活動
- `GET /api/v1/events/[id]` - 取得單一活動
- `PUT /api/v1/events/[id]` - 更新活動
- `DELETE /api/v1/events/[id]` - 刪除活動

## UI Pages

- `/events` - 活動列表頁面
- `/events/new` - 新增活動頁面
- `/events/[id]` - 編輯活動頁面

## Success Criteria

- 管理者可在 1 分鐘內完成新增活動
- 活動列表可在 2 秒內載入
- 支援手機和平板操作
