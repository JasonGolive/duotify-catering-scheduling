# Feature Specification: Salary Report Module

**Feature Branch**: `004-salary-report`  
**Created**: 2026-02-28  
**Status**: In Progress

## Overview

建立薪資報表模組，讓管理者可以依月份查看員工薪資統計，並匯出報表。

## User Stories

### User Story 1 - 月份薪資總覽 (Priority: P1)

管理者需要查看特定月份所有員工的薪資總計。

**Acceptance Scenarios**:
1. 可選擇年份和月份
2. 顯示該月所有有出勤的員工
3. 顯示每位員工的活動數、總薪資、調整金額、實付金額
4. 顯示整體統計（總活動數、總支出）

### User Story 2 - 員工薪資明細 (Priority: P1)

管理者需要查看單一員工的詳細出勤與薪資記錄。

**Acceptance Scenarios**:
1. 列出該員工當月所有參與的活動
2. 顯示每場活動的出勤狀態、原薪資、調整後薪資
3. 顯示小計

### User Story 3 - 報表匯出 (Priority: P2)

管理者需要將報表匯出以供會計使用。

**Acceptance Scenarios**:
1. 可匯出 CSV 格式
2. 包含所有必要欄位：員工姓名、活動名稱、日期、出勤狀態、薪資
3. 檔名包含年月資訊

## Data Requirements

從現有資料表取得：
- `EventStaff` - 出勤記錄、薪資
- `Event` - 活動資訊、日期
- `Staff` - 員工姓名、電話

## API Endpoints

- `GET /api/v1/reports/salary?year=2026&month=3` - 取得月份薪資報表
- `GET /api/v1/reports/salary/export?year=2026&month=3&format=csv` - 匯出報表

### Response Schema

```json
{
  "year": 2026,
  "month": 3,
  "summary": {
    "totalEvents": 10,
    "totalStaff": 5,
    "totalSalary": 50000,
    "totalAdjusted": 48000
  },
  "staffSalaries": [
    {
      "staffId": "xxx",
      "staffName": "Jason",
      "phone": "0926068547",
      "eventCount": 3,
      "totalSalary": 6000,
      "adjustments": -500,
      "finalAmount": 5500,
      "events": [
        {
          "eventId": "xxx",
          "eventName": "蔡先生",
          "date": "2026-03-03",
          "status": "ATTENDED",
          "salary": 2000,
          "adjustedSalary": 2000
        }
      ]
    }
  ]
}
```

## UI Pages

- `/reports/salary` - 薪資報表主頁

## UI Components

1. **月份選擇器** - 年月下拉選單
2. **統計卡片** - 總活動、總人次、總支出
3. **員工薪資表格** - 可展開查看明細
4. **匯出按鈕** - CSV 下載

## Business Rules

1. **薪資計算**:
   - ATTENDED/CONFIRMED: 使用 `adjustedSalary` 或 `salary`
   - LATE: 使用 `adjustedSalary`（需手動調整）
   - ABSENT/CANCELLED: 0
   - SCHEDULED: 不計入（活動尚未結束）

2. **月份範圍**: 依活動日期（Event.date）篩選

3. **幣值**: 所有金額以 TWD 顯示，無小數

## Success Criteria

- 報表在 3 秒內載入完成
- CSV 匯出在 5 秒內完成
- 金額計算正確無誤
