# 通知功能設定指南

## 一、Email 通知設定 (Resend)

### 步驟 1：註冊 Resend 帳號
1. 前往 https://resend.com
2. 點擊「Sign Up」註冊帳號（可用 GitHub 登入）
3. 免費方案：每月 3,000 封郵件

### 步驟 2：取得 API Key
1. 登入後，進入 Dashboard
2. 點擊左側「API Keys」
3. 點擊「Create API Key」
4. 名稱輸入：`duotify-catering`
5. 權限選擇：`Full access`
6. 點擊「Create」，複製產生的 API Key（格式：`re_xxxxxxxxx`）

### 步驟 3：設定發送網域（可選但建議）
如果要用自己的網域發送：
1. 點擊左側「Domains」
2. 點擊「Add Domain」
3. 輸入您的網域（例如：`yourdomain.com`）
4. 按照指示在 DNS 設定中加入 TXT 記錄
5. 等待驗證完成（通常 1-24 小時）

**暫時方案**：使用 Resend 預設的 `onboarding@resend.dev` 發送測試

### 步驟 4：在 Railway 設定環境變數
在 Railway Dashboard 中：
1. 選擇您的專案
2. 點擊「Variables」
3. 新增以下變數：

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=北歐餐桌到府私廚
```

如果還沒設定網域，使用：
```
FROM_EMAIL=onboarding@resend.dev
```

---

## 二、LINE Notify 設定

### 方式 A：管理者統一設定（簡單）

適用於：管理者代為通知員工，所有通知發到一個群組

#### 步驟 1：建立 LINE Notify 群組
1. 在 LINE 建立一個群組（例如：「北歐餐桌-工作通知」）
2. 將所有員工加入此群組

#### 步驟 2：取得群組的 Access Token
1. 前往 https://notify-bot.line.me/
2. 用 LINE 帳號登入
3. 點擊右上角您的名稱 → 「個人頁面」
4. 往下滑到「發行存取權杖」區塊
5. 點擊「發行權杖」
6. 權杖名稱輸入：`北歐餐桌通知`
7. 選擇剛才建立的群組
8. 點擊「發行」，複製 Access Token

#### 步驟 3：設定系統通知
可以設定一個「系統通知 Token」，讓所有排班通知都發到群組：

```
LINE_NOTIFY_GROUP_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 方式 B：員工個別綁定（推薦）

適用於：每位員工收到個人通知

#### 員工操作步驟：
1. 前往 https://notify-bot.line.me/
2. 用自己的 LINE 帳號登入
3. 點擊右上角名稱 → 「個人頁面」
4. 點擊「發行權杖」
5. 權杖名稱：`北歐餐桌排班通知`
6. 選擇「透過1對1聊天接收LINE Notify的通知」
7. 點擊「發行」，複製 Token
8. 將 Token 提供給管理者

#### 管理者設定步驟：
在系統中編輯員工資料，將員工的 LINE Notify Token 填入。

---

## 三、每日提醒設定 (Cron Job)

### Railway 內建 Cron（推薦）

在專案根目錄建立 `railway.toml`：

```toml
[deploy]
startCommand = "npx prisma migrate deploy && npm start"

[[crons]]
name = "daily-reminders"
schedule = "0 0 * * *"  # UTC 00:00 = 台灣 08:00
endpoint = "/api/cron/daily-reminders"
```

### 或使用外部 Cron 服務

#### 選項 1：cron-job.org（免費）
1. 前往 https://cron-job.org 註冊
2. 建立新工作：
   - URL：`https://your-app.railway.app/api/cron/daily-reminders`
   - 時間：每天 08:00
   - Headers：`Authorization: Bearer YOUR_CRON_SECRET`

#### 選項 2：UptimeRobot（免費）
1. 前往 https://uptimerobot.com 註冊
2. 新增 Monitor，類型選 HTTP(s)
3. 設定每日觸發

### 設定 Cron Secret（安全性）
在 Railway Variables 新增：
```
CRON_SECRET=your-random-secret-string-here
```

---

## 四、完整環境變數清單

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=北歐餐桌到府私廚

# LINE Notify (可選 - 群組通知)
LINE_NOTIFY_GROUP_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx

# Cron Job 安全驗證
CRON_SECRET=your-random-secret-string

# 已有的變數
DATABASE_URL=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

---

## 五、測試通知功能

### 測試 Email
```bash
# 在系統中指派員工到活動，員工應收到 Email 通知
# 或使用 API 測試：
curl -X POST https://your-app.railway.app/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "action": "notifyStaff",
    "staffId": "員工ID",
    "type": "ASSIGNMENT",
    "title": "測試通知",
    "content": "這是一封測試通知郵件"
  }'
```

### 測試 LINE Notify
```bash
# 測試 LINE Notify Token 是否有效
curl -X POST https://notify-api.line.me/api/notify \
  -H "Authorization: Bearer YOUR_LINE_NOTIFY_TOKEN" \
  -d "message=測試通知"
```

### 測試每日提醒
```bash
curl https://your-app.railway.app/api/cron/daily-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 六、常見問題

### Q: Email 收不到？
1. 檢查 RESEND_API_KEY 是否正確
2. 檢查員工的 email 是否已填寫
3. 檢查垃圾郵件匣
4. 確認網域已驗證（或使用 resend.dev）

### Q: LINE 收不到？
1. 確認 LINE Notify Token 有效
2. 確認員工的 lineNotifyToken 欄位已填寫
3. 確認員工的 lineNotify 設定為 true

### Q: 通知發送失敗？
查看通知記錄 API：
```bash
GET /api/v1/notifications?status=FAILED
```
