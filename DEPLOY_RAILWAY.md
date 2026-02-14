# Railway 部署指南

本指南將協助你將餐飲外燴排班管理系統部署至 Railway。

---

## 📋 前置準備

### 1. 建立 Railway 帳號
- 前往 [Railway.app](https://railway.app)
- 使用 GitHub 帳號登入（推薦）
- 首次註冊贈送 $5 額度（足夠開發測試）

### 2. 安裝 Railway CLI（選用）
```bash
npm install -g @railway/cli
railway login
```

### 3. 準備 Clerk 身份驗證
- 前往 [Clerk.com](https://clerk.com)
- 建立應用程式
- 取得 API Keys（稍後會用到）

---

## 🚀 部署步驟

### 步驟 1：建立 Railway 專案

#### 方式 A：透過 Railway Web UI（推薦）
1. 登入 Railway Dashboard
2. 點擊 **"New Project"**
3. 選擇 **"Deploy from GitHub repo"**
4. 授權並選擇此專案的 GitHub repository
5. Railway 會自動偵測 Next.js 並開始部署

#### 方式 B：透過 CLI
```bash
# 在專案根目錄執行
railway init
railway up
```

---

### 步驟 2：新增 PostgreSQL 資料庫

1. 在 Railway 專案頁面，點擊 **"+ New"**
2. 選擇 **"Database"** → **"Add PostgreSQL"**
3. Railway 會自動建立資料庫並產生 `DATABASE_URL`
4. 資料庫會自動連結到你的應用程式

---

### 步驟 3：設定環境變數

在 Railway 專案中，點擊你的 Web Service → **"Variables"** 標籤，新增以下變數：

#### 必要變數

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `DATABASE_URL` | PostgreSQL 連線字串 | 自動產生（從 Postgres service） |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 公開金鑰 | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk 密鑰 | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | 登入頁路徑 | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | 註冊頁路徑 | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | 登入後導向 | `/staff` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | 註冊後導向 | `/staff` |
| `NEXT_PUBLIC_APP_URL` | 應用程式網址 | `https://your-app.railway.app` |

#### 設定 DATABASE_URL（重要）

Railway 會自動建立 `DATABASE_URL` 變數，但你需要確認格式：

```
postgresql://postgres:password@host:5432/railway?schema=public
```

如果沒有 `?schema=public`，請手動新增。

---

### 步驟 4：執行資料庫遷移

#### 方式 A：透過 Railway CLI（推薦）

```bash
# 連接到 Railway 環境
railway link

# 執行遷移
railway run npm run db:deploy

# 建立測試資料（選用）
railway run npm run db:seed
```

#### 方式 B：透過 Railway Web UI

1. 點擊 Web Service → **"Settings"** → **"Deploy"**
2. 在 **"Custom Start Command"** 暫時改為：
   ```
   npm run db:deploy && npm start
   ```
3. 等待部署完成後，改回 `npm start`

---

### 步驟 5：設定 Clerk Webhook（重要）

在 Clerk Dashboard：

1. 前往 **"Webhooks"**
2. 新增 Endpoint：`https://your-app.railway.app/api/webhooks/clerk`
3. 選擇事件：`user.created`, `user.updated`, `user.deleted`
4. 複製 **Signing Secret**
5. 在 Railway 新增環境變數：
   - `CLERK_WEBHOOK_SECRET=whsec_...`

---

### 步驟 6：更新 Clerk 設定

在 Clerk Dashboard：

1. 前往 **"Paths"**
2. 更新路徑：
   - Sign-in URL: `https://your-app.railway.app/sign-in`
   - Sign-up URL: `https://your-app.railway.app/sign-up`
   - After sign-in: `https://your-app.railway.app/staff`
   - After sign-up: `https://your-app.railway.app/staff`

---

## ✅ 驗證部署

### 1. 檢查應用程式狀態
```bash
railway status
railway logs
```

### 2. 訪問你的應用程式
- 前往 Railway 提供的網址：`https://your-app.railway.app`
- 應該會看到登入頁面

### 3. 測試功能
1. 註冊新帳號
2. 在 Clerk Dashboard 將帳號設為 `MANAGER` 角色
3. 登入後訪問 `/staff` 頁面
4. 測試新增人員功能

---

## 🔧 常見問題

### Q1: 部署失敗 - "Prisma Client not generated"
**解決方法**：
```json
// package.json 中已包含 postinstall script
"postinstall": "prisma generate"
```
重新部署即可。

### Q2: 資料庫連線失敗
**檢查項目**：
- `DATABASE_URL` 格式是否正確
- 是否包含 `?schema=public`
- PostgreSQL service 是否正常運行

### Q3: 環境變數未生效
**解決方法**：
- 確認變數名稱正確（區分大小寫）
- 設定後需重新部署（點擊 "Deploy"）

### Q4: 登入後導向錯誤
**檢查項目**：
- Clerk Dashboard 的 Paths 設定
- `NEXT_PUBLIC_APP_URL` 是否正確
- 環境變數是否包含 `NEXT_PUBLIC_` 前綴

---

## 💰 成本估算

### Railway 定價（按使用量計費）

| 資源 | 估算用量 | 月費用 |
|------|---------|--------|
| Web Service | ~10-20 小時運行 | $5-10 |
| PostgreSQL | 256 MB - 1 GB | $5-10 |
| 網路流量 | < 100 GB | $0-5 |
| **總計** | | **$10-25/月** |

**免費額度**：
- 新用戶：$5 額度/月
- 開發環境足夠使用

---

## 🔄 持續部署

### 自動部署
每次推送到 GitHub main 分支時，Railway 會自動：
1. 拉取最新代碼
2. 執行 `npm install && npm run build`
3. 重新部署應用程式

### 手動部署
```bash
railway up
```

---

## 📊 監控與日誌

### 查看即時日誌
```bash
railway logs
```

或在 Railway Dashboard → **"Deployments"** → **"View Logs"**

### 監控資源使用
Railway Dashboard → **"Metrics"** 標籤可查看：
- CPU 使用率
- 記憶體使用
- 網路流量
- 請求數量

---

## 🆘 取得協助

### Railway 官方資源
- 文件：https://docs.railway.app
- Discord：https://discord.gg/railway
- GitHub：https://github.com/railwayapp

### Clerk 支援
- 文件：https://clerk.com/docs
- Discord：https://clerk.com/discord

---

## 🎉 部署完成！

恭喜！你的餐飲外燴排班管理系統已成功部署至 Railway。

### 下一步
- 邀請團隊成員註冊
- 在 Clerk 設定使用者角色
- 開始新增服務人員資料
- 繼續開發其他模組（場次管理、排班管理等）

---

**需要協助？** 請參考專案 README.md 或聯繫開發團隊。
