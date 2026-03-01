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

---

## 二、LINE Messaging API 設定

### 步驟 1：建立 LINE 官方帳號
1. 前往 https://manager.line.biz/
2. 登入並建立官方帳號
3. 帳號類型選擇「未認證帳號」（免費）

### 步驟 2：啟用 Messaging API
1. 在 LINE Official Account Manager 中
2. 點擊右上角「設定」
3. 左側選單點擊「Messaging API」
4. 點擊「啟用 Messaging API」
5. 選擇或建立 Provider

### 步驟 3：前往 LINE Developers Console
1. 前往 https://developers.line.biz/console/
2. 選擇您的 Provider
3. 選擇剛才建立的 Channel

### 步驟 4：取得 Channel Access Token
1. 在 Channel 頁面，點擊「Messaging API」標籤
2. 往下找到「Channel access token (long-lived)」
3. 點擊「Issue」產生 Token
4. 複製這個 Token

### 步驟 5：取得 Channel Secret
1. 在同一頁面，點擊「Basic settings」標籤
2. 找到「Channel secret」
3. 複製這個值

### 步驟 6：設定 Webhook URL
1. 回到「Messaging API」標籤
2. 在「Webhook settings」區塊
3. 設定 Webhook URL：
   ```
   https://your-app.railway.app/api/line/webhook
   ```
4. 開啟「Use webhook」

### 步驟 7：關閉自動回應
1. 在 LINE Official Account Manager
2. 設定 → 回應設定
3. 關閉「自動回應訊息」
4. 關閉「加入好友的歡迎訊息」（由系統處理）

### 步驟 8：在 Railway 設定環境變數
```
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxx
```

---

## 三、員工 LINE 綁定流程

### 員工操作步驟：
1. 掃描 LINE 官方帳號的 QR Code 加好友
2. 加入後會收到歡迎訊息
3. 輸入「綁定 手機號碼」（例如：`綁定 0912345678`）
4. 系統會自動綁定，之後即可收到排班通知

### QR Code 取得方式：
1. LINE Official Account Manager
2. 主頁 → 加入好友指南
3. 下載 QR Code

---

## 四、每日提醒設定 (Cron Job)

### 使用外部 Cron 服務

#### 選項 1：cron-job.org（免費）
1. 前往 https://cron-job.org 註冊
2. 建立新工作：
   - URL：`https://your-app.railway.app/api/cron/daily-reminders`
   - 時間：每天 08:00
   - Headers：`Authorization: Bearer YOUR_CRON_SECRET`

#### 選項 2：UptimeRobot（免費）
1. 前往 https://uptimerobot.com 註冊
2. 新增 Monitor，類型選 HTTP(s)

### 設定 Cron Secret（安全性）
在 Railway Variables 新增：
```
CRON_SECRET=your-random-secret-string-here
```

---

## 五、完整環境變數清單

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=北歐餐桌到府私廚

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxx

# Cron Job 安全驗證
CRON_SECRET=your-random-secret-string

# 已有的變數
DATABASE_URL=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

---

## 六、測試通知功能

### 測試 Email
在系統中指派員工到活動，員工應收到 Email 通知。

### 測試 LINE
1. 確認員工已綁定 LINE
2. 指派該員工到活動
3. 應該會收到 LINE 訊息通知

### 測試每日提醒
```bash
curl https://your-app.railway.app/api/cron/daily-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 七、常見問題

### Q: LINE 訊息收不到？
1. 確認 LINE_CHANNEL_ACCESS_TOKEN 正確
2. 確認員工已透過手機號碼綁定
3. 確認員工的 lineNotify 設定為 true
4. 檢查 LINE Webhook URL 是否正確

### Q: 員工綁定失敗？
1. 確認手機號碼與系統中的一致（10位數字）
2. 確認該手機號碼未被其他 LINE 帳號綁定

### Q: Email 收不到？
1. 檢查 RESEND_API_KEY 是否正確
2. 檢查員工的 email 是否已填寫
3. 檢查垃圾郵件匣
