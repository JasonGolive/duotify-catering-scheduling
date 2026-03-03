# 北歐餐桌到府私廚 - 排班管理系統規格書

## 系統概述

本系統為外燴餐飲服務的人員排班與活動管理平台，部署於 Railway。

---

## 功能模組

### 1. 員工管理 (`/staff`)

| 功能 | 說明 |
|------|------|
| 員工列表 | 顯示所有員工，支援搜尋、篩選狀態 |
| 新增/編輯員工 | 姓名、電話、Email、職能(外場/熱台/皆可)、每場薪資 |
| 駕駛能力 | 會開車、有自備車 |
| 通知設定 | LINE 綁定、Email 通知開關 |
| 可用性管理 | 員工行事曆，標記不可出勤日期及原因 |

**資料欄位：**
- `name`, `phone`, `email`, `skill`, `perEventSalary`
- `canDrive`, `hasOwnCar`
- `lineUserId`, `lineNotify`, `emailNotify`
- `status` (ACTIVE/INACTIVE)

---

### 2. 活動管理 (`/events`)

| 功能 | 說明 |
|------|------|
| 活動列表 | 依日期排序，支援狀態/類型篩選 |
| 新增/編輯活動 | 完整活動資訊表單 |
| 活動詳情 | 查看排班人員、付款狀態 |

**資料欄位：**
- 基本：`name`, `date`, `assemblyTime`, `startTime`, `mealTime`
- 場地：`venueId`, `location`, `address`
- 人數：`adultsCount`, `childrenCount`, `vegetarianCount`
- 聯絡：`contactName`, `contactPhone`
- 類型：`eventType` (婚宴/尾牙/春酒/生日/企業/其他)
- 餐車需求：`requireBigTruck`, `requireSmallTruck`
- 內容：`menu`, `reminders`, `notes`
- 付款：`totalAmount`, `depositAmount/Method/Date`, `balanceAmount/Method/Date`
- 狀態：`status` (待確認/已確認/進行中/已完成/已取消)

---

### 3. 場地管理 (`/venues`)

| 功能 | 說明 |
|------|------|
| 場地列表 | 常用場地/民宿主檔 |
| 新增/編輯場地 | 名稱、地址、聯絡人、設備、注意事項 |

---

### 4. 排班管理 (`/scheduling`)

| 功能 | 說明 |
|------|------|
| 月曆檢視 | 按月份顯示所有活動 |
| 人員指派 | 點選活動→查看可用員工→勾選指派 |
| 衝突檢查 | 同日有其他場次的員工顯示警告 |
| 交通安排 | 為每位員工選擇交通工具（大餐車/小餐車/店長車/自行開車） |
| 通知狀態 | 顯示已通知/待通知人數 |

**車輛容量：**
- 大餐車：3 人（駕駛 1 + 乘客 2）
- 小餐車：2 人（駕駛 1 + 乘客 1）
- 店長車：4 人（駕駛 1 + 乘客 3）

---

### 5. 通知管理 (`/notifications`)

| 功能 | 說明 |
|------|------|
| 批次通知 | 日期範圍篩選、勾選場次、預覽確認後發送 |
| CSV 匯出 | 匯出通知總表（含 LINE/Email 狀態） |
| 異動通知 | 活動關鍵資訊變更時，可重發通知給已通知人員 |

**通知管道：**
- LINE Messaging API（透過加好友取得 userId）
- Email（開發中）

**通知觸發時機：**
- 管理者手動批次發送
- 活動異動（日期/時間/地點變更）後確認發送

---

### 6. 薪資管理 (`/salary`)

| 功能 | 說明 |
|------|------|
| 薪資總表 | 按月份統計各員工薪資 |
| 匯入打工記錄 | 支援 Excel/CSV 批次匯入 |
| 薪資報表 | 產出月薪資報表 |

---

## API 端點

### 員工 API
```
GET    /api/v1/staff              # 員工列表
POST   /api/v1/staff              # 新增員工
GET    /api/v1/staff/[id]         # 員工詳情
PUT    /api/v1/staff/[id]         # 更新員工
DELETE /api/v1/staff/[id]         # 刪除員工
GET    /api/v1/staff/[id]/availability  # 可用性
POST   /api/v1/staff/[id]/availability  # 設定可用性
```

### 活動 API
```
GET    /api/v1/events             # 活動列表（支援日期範圍）
POST   /api/v1/events             # 新增活動
GET    /api/v1/events/[id]        # 活動詳情
PUT    /api/v1/events/[id]        # 更新活動（含異動檢測）
GET    /api/v1/events/[id]/staff  # 排班人員
POST   /api/v1/events/[id]/staff  # 指派人員
PATCH  /api/v1/events/[id]/staff/[staffId]  # 更新交通安排
DELETE /api/v1/events/[id]/staff/[staffId]  # 移除人員
GET    /api/v1/events/[id]/notify # 通知狀態
POST   /api/v1/events/[id]/notify # 發送排班通知
PATCH  /api/v1/events/[id]/notify # 發送異動通知
```

### 其他 API
```
GET    /api/v1/venues             # 場地列表
GET    /api/v1/availability       # 指定日期可用員工
GET    /api/v1/notifications      # 通知記錄
GET    /api/v1/reports/salary     # 薪資報表
POST   /api/v1/worklogs/import    # 匯入打工記錄
POST   /api/line/webhook          # LINE Webhook
```

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端 | Next.js 16 + React + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 認證 | Clerk |
| 資料庫 | PostgreSQL (Railway) |
| ORM | Prisma |
| 通知 | LINE Messaging API |
| 部署 | Railway |

---

## 權限控制

| 角色 | 權限 |
|------|------|
| MANAGER | 完整管理權限 |
| STAFF | 查看個人排班、更新可用性 |

---

## 員工通知綁定流程

1. 員工加入 LINE 官方帳號
2. 傳送「綁定 手機號碼」訊息
3. 系統比對手機號碼，綁定 LINE userId
4. 後續排班通知自動推送

---

## 版本記錄

| 版本 | 日期 | 說明 |
|------|------|------|
| 1.0 | 2026-03-01 | 初版上線 |
| 1.1 | 2026-03-01 | 新增批次通知、異動通知 |
| 1.2 | 2026-03-02 | 新增交通工具安排 |
| 1.3 | 2026-03-03 | 修復 Tailwind CSS v4 生產環境編譯問題，改用內聯樣式 |

---

## 已知問題與修復

### Tailwind CSS v4 生產環境問題 (v1.3)

**問題描述：**
Tailwind CSS v4 的類名（如 `space-y-6`, `grid-cols-2`, `md:hidden` 等）在生產環境無法正確編譯，導致 UI 元素不顯示或佈局錯誤。

**解決方案：**
將關鍵 UI 元件改用內聯 `style` 屬性：
- `components/layout/sidebar.tsx` - 側邊欄及漢堡選單
- `app/(dashboard)/layout.tsx` - Dashboard 佈局
- `app/(dashboard)/home/page.tsx` - Dashboard 首頁

**響應式處理：**
由於無法使用 Tailwind 的 `md:` 前綴，改用 `useEffect` + `useState` 檢測 `window.innerWidth`：
```tsx
const [isMobile, setIsMobile] = useState(true);
useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```
