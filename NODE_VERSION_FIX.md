# Node.js 版本問題解決方案

## 問題描述
```
npm warn EBADENGINE required: { node: '^20.19 || ^22.12 || >=24.0' }
npm warn EBADENGINE current: { node: 'v20.18.1', npm: '10.8.2' }
```

## 解決方案

### 選項 1：升級本地 Node.js 版本（推薦）

使用 nvm (Node Version Manager):

```bash
# 安裝 Node.js 22 (LTS)
nvm install 22
nvm use 22

# 或安裝最新版本
nvm install node
nvm use node

# 驗證版本
node -v  # 應該顯示 v22.x.x 或更高
```

### 選項 2：繼續使用 v20.18.1（暫時解法）

這只是警告，不是錯誤。你的專案仍然可以運行，但建議升級以避免潛在問題。

已完成的修改：
- ✅ 在 `package.json` 加入 `engines` 設定（允許 Node >= 20.18.0）
- ✅ 在 `nixpacks.toml` 設定 Railway 使用 Node.js 22

## Railway 部署
Railway 會自動使用 Node.js 22，不受本地版本影響。你可以：
1. 本地繼續用 v20.18.1 開發（警告可忽略）
2. Railway 會用 Node.js 22 部署（無警告）

## 推薦做法
- **本地開發**：升級到 Node.js 22
- **Railway 部署**：已配置使用 Node.js 22（無需手動設定）

## 快速升級指令（macOS）

```bash
# 安裝 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# 重新載入終端
source ~/.zshrc

# 安裝 Node.js 22
nvm install 22
nvm use 22
nvm alias default 22

# 驗證
node -v
npm -v
```

升級後，重新安裝依賴：
```bash
rm -rf node_modules package-lock.json
npm install
```
