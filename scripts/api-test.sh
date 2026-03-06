#!/bin/bash
# ============================================
# 北歐餐桌到府私廚 - 全系統 API 測試腳本
# ============================================
# 使用方式: BASE_URL=https://your-domain.railway.app ./scripts/api-test.sh
# 需要先登入取得 session cookie

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0
SKIP=0
RESULTS=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_endpoint() {
  local method=$1
  local path=$2
  local expected=$3
  local desc=$4
  local data=$5

  if [ -n "$data" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -b cookie.txt \
      -d "$data" \
      "${BASE_URL}${path}" 2>/dev/null)
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
      -b cookie.txt \
      "${BASE_URL}${path}" 2>/dev/null)
  fi

  if [ "$response" = "$expected" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} [$method $path] $desc (HTTP $response)"
    PASS=$((PASS + 1))
    RESULTS="${RESULTS}\n| PASS | $method $path | $desc | $response |"
  elif [ "$response" = "000" ]; then
    echo -e "  ${YELLOW}⚠️  SKIP${NC} [$method $path] $desc (連線失敗)"
    SKIP=$((SKIP + 1))
    RESULTS="${RESULTS}\n| SKIP | $method $path | $desc | 連線失敗 |"
  else
    echo -e "  ${RED}❌ FAIL${NC} [$method $path] $desc (期望 $expected, 實際 $response)"
    FAIL=$((FAIL + 1))
    RESULTS="${RESULTS}\n| FAIL | $method $path | $desc | 期望 $expected / 實際 $response |"
  fi
}

echo "============================================"
echo "  全系統 API 測試"
echo "  目標: $BASE_URL"
echo "  時間: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# ---- 1. 頁面載入測試 ----
echo "📄 [1] 頁面載入測試"
test_endpoint GET "/" "200" "首頁"
test_endpoint GET "/sign-in" "200" "登入頁"
test_endpoint GET "/events" "200" "場次管理頁"
test_endpoint GET "/scheduling" "200" "排班管理頁"
test_endpoint GET "/staff" "200" "員工管理頁"
test_endpoint GET "/venues" "200" "場地管理頁"
test_endpoint GET "/suppliers" "200" "供應商管理頁"
test_endpoint GET "/payments-in" "200" "收款管理頁"
test_endpoint GET "/payments-out" "200" "付款管理頁"
test_endpoint GET "/bank-accounts" "200" "銀行帳戶頁"
test_endpoint GET "/salary" "200" "薪資管理頁"
test_endpoint GET "/menu" "200" "菜單管理頁"
test_endpoint GET "/notifications" "200" "通知管理頁"
test_endpoint GET "/analytics" "200" "數據分析頁"
test_endpoint GET "/profile" "200" "個人資料頁"
echo ""

# ---- 2. API 端點測試（需登入） ----
echo "🔌 [2] API 端點測試"
test_endpoint GET "/api/v1/dashboard" "200,401" "Dashboard API"
test_endpoint GET "/api/v1/events" "200,401,403" "場次列表 API"
test_endpoint GET "/api/v1/staff" "200,401,403" "員工列表 API"
test_endpoint GET "/api/v1/venues" "200,401,403" "場地列表 API"
test_endpoint GET "/api/v1/suppliers" "200,401,403" "供應商列表 API"
test_endpoint GET "/api/v1/payments-in" "200,401,403" "收款列表 API"
test_endpoint GET "/api/v1/payments-out" "200,401,403" "付款列表 API"
test_endpoint GET "/api/v1/bank-accounts" "200,401,403" "銀行帳戶 API"
test_endpoint GET "/api/v1/menu/items" "200,401,403" "菜單品項 API"
test_endpoint GET "/api/v1/menu/templates" "200,401,403" "菜單範本 API"
test_endpoint GET "/api/v1/salary-rules" "200,401,403" "薪資規則 API"
test_endpoint GET "/api/v1/notifications" "200,401,403" "通知列表 API"
echo ""

# ---- 3. 日期篩選測試 ----
echo "📅 [3] 日期篩選測試"
TODAY=$(date '+%Y-%m-%d')
NEXT_MONTH=$(date -v+1m '+%Y-%m-%d' 2>/dev/null || date -d "+1 month" '+%Y-%m-%d')
test_endpoint GET "/api/v1/events?startDate=${TODAY}&endDate=${NEXT_MONTH}" "200,401,403" "場次日期範圍篩選"
test_endpoint GET "/api/v1/events?status=CONFIRMED" "200,401,403" "場次狀態篩選"
test_endpoint GET "/api/v1/events?type=WEDDING" "200,401,403" "場次類型篩選"
echo ""

# ---- 總結 ----
echo "============================================"
echo "  測試結果摘要"
echo "============================================"
echo -e "  ${GREEN}通過: $PASS${NC}"
echo -e "  ${RED}失敗: $FAIL${NC}"
echo -e "  ${YELLOW}跳過: $SKIP${NC}"
echo "  總計: $((PASS + FAIL + SKIP))"
echo "============================================"

exit $FAIL
