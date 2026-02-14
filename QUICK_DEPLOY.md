# Railway 快速部署步驟

## 📋 準備清單

在開始部署前，請準備：
- [ ] Railway 帳號（用 GitHub 登入）
- [ ] Clerk 帳號和 API Keys（如果還沒有，我會協助你）

---

## 🚀 部署步驟

### 第一步：建立 Railway 專案

1. 前往 **https://railway.app**
2. 點擊右上角 **"Login"** → 用 GitHub 登入
3. 登入後，點擊 **"New Project"**
4. 選擇 **"Deploy from GitHub repo"**
5. 在列表中找到 `duotify-catering-scheduling` 並點擊
6. Railway 會自動開始部署（這次會失敗，因為還沒有環境變數）

### 第二步：新增 PostgreSQL 資料庫

1. 在專案頁面，點擊右上角 **"+ New"**
2. 選擇 **"Database"**
3. 點擊 **"Add PostgreSQL"**
4. 等待 30-60 秒，資料庫建立完成
5. 資料庫會自動連結到你的 Web Service

### 第三步：設定環境變數

#### 3.1 點擊你的 Web Service
找到顯示 "duotify-catering-scheduling" 的服務卡片並點擊

#### 3.2 切換到 Variables 標籤
點擊上方的 **"Variables"** 標籤

#### 3.3 點擊 "RAW Editor"
可以一次貼上所有變數

#### 3.4 貼上以下變數（需要修改的部分）

```bash
# Clerk Authentication
# ⚠️ 這些需要從 clerk.com 取得（下面會教你）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_替換成你的key
CLERK_SECRET_KEY=sk_test_替換成你的key

# Clerk Paths（這些不用改）
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/staff
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/staff

# App URL
# ⚠️ 先用預設值，部署成功後再改成實際網址
NEXT_PUBLIC_APP_URL=https://duotify-catering-scheduling-production.up.railway.app
```

### 第四步：取得 Clerk API Keys

#### 如果你已有 Clerk 帳號：
1. 前往 https://dashboard.clerk.com
2. 選擇你的應用（或建立新的）
3. 左側選單點擊 **"API Keys"**
4. 複製 `Publishable key` 和 `Secret key`
5. 貼回 Railway 的環境變數

#### 如果你還沒有 Clerk 帳號：
1. 前往 https://clerk.com
2. 點擊 **"Start building for free"**
3. 用 GitHub 登入
4. 建立新應用：
   - Application name: `Duotify Catering`
   - 選擇登入方式：Email + Password（勾選）
   - 點擊 **"Create application"**
5. 建立完成後會顯示 API Keys
6. 複製並貼到 Railway

### 第五步：更新 NEXT_PUBLIC_APP_URL

1. 在 Railway，點擊 Web Service → **"Settings"** 標籤
2. 找到 **"Domains"** 區塊
3. 複製顯示的網址（例如：`duotify-catering-scheduling-production.up.railway.app`）
4. 回到 **"Variables"** 標籤
5. 更新 `NEXT_PUBLIC_APP_URL` 為：
   ```
   https://你複製的網址
   ```

### 第六步：執行資料庫遷移

在你的電腦終端執行：

```bash
# 安裝 Railway CLI（如果還沒裝）
npm install -g @railway/cli

# 登入
railway login

# 連結到專案
railway link

# 執行資料庫遷移
railway run npm run db:deploy

# 建立測試資料（選用）
railway run npm run db:seed
```

### 第七步：重新部署

1. 回到 Railway Dashboard
2. 點擊 Web Service
3. 點擊 **"Deployments"** 標籤
4. 點擊右上角 **"Deploy"** → **"Redeploy"**
5. 等待 2-3 分鐘

---

## ✅ 驗證部署

### 1. 檢查部署狀態
在 **"Deployments"** 標籤，應該看到綠色的 "Success"

### 2. 訪問你的應用
點擊 **"Settings"** → **"Domains"** → 點擊網址

### 3. 測試登入
應該會看到 Clerk 登入頁面

---

## ⚠️ 常見問題

### 問題 1：部署失敗 "Build failed"
**解決**：檢查環境變數是否正確設定，特別是 Clerk keys

### 問題 2：無法連線資料庫
**解決**：確認 PostgreSQL service 正在運行（綠色狀態）

### 問題 3：登入頁面打不開
**解決**：
1. 檢查 Clerk Dashboard → **"Paths"**
2. 確認 URLs 設定為你的 Railway 網址

---

## 📞 需要協助？

如果遇到任何問題，告訴我：
1. 在哪個步驟卡住
2. 看到什麼錯誤訊息
3. 截圖（如果可以）

我會立即協助你！
