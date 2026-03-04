"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, DollarSign, TrendingUp } from "lucide-react";

interface PaymentIn {
  id: string;
  paymentNumber: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  paymentCategory: string;
  status: string;
  receiptNumber: string | null;
  event: {
    id: string;
    name: string;
    date: string;
  } | null;
  bankAccount: {
    id: string;
    accountName: string;
  } | null;
}

const categoryLabels: Record<string, string> = {
  DEPOSIT: "訂金",
  FINAL_PAYMENT: "尾款",
  ADDITIONAL: "追加",
  REFUND: "退款",
};

const methodLabels: Record<string, string> = {
  CASH: "現金",
  BANK_TRANSFER: "銀行轉帳",
  CREDIT_CARD: "信用卡",
  CHECK: "支票",
  OTHER: "其他",
};

const statusLabels: Record<string, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  CANCELLED: "已作廢",
};

export default function PaymentsInPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentIn[]>([]);
  const [stats, setStats] = useState({ totalAmount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  useEffect(() => {
    fetchPayments();
  }, [categoryFilter, statusFilter, methodFilter, search]);

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (methodFilter !== "all") params.append("paymentMethod", methodFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/v1/payments-in?${params.toString()}`);
      if (!res.ok) throw new Error("載入失敗");

      const data = await res.json();
      setPayments(data.payments);
      setStats(data.stats);
    } catch (error) {
      toast.error("載入收款列表失敗");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">載入中...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', letterSpacing: '-0.025em' }}>收款管理</h1>
          <p style={{ color: '#6b7280' }}>
            共 {payments.length} 筆收款記錄
          </p>
        </div>
        <Button onClick={() => router.push("/payments-in/new")}>
          <Plus className="h-4 w-4 mr-2" />
          新增收款
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">已確認收款總額</p>
              <p className="text-3xl font-bold text-green-600">
                ${stats.totalAmount.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-green-600" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">收款筆數</p>
              <p className="text-3xl font-bold">{stats.totalCount} 筆</p>
            </div>
            <TrendingUp className="h-10 w-10 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* 篩選列 */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜尋單號、客戶名稱、收據號碼..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="類別" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部類別</SelectItem>
              <SelectItem value="DEPOSIT">訂金</SelectItem>
              <SelectItem value="FINAL_PAYMENT">尾款</SelectItem>
              <SelectItem value="ADDITIONAL">追加</SelectItem>
              <SelectItem value="REFUND">退款</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger>
              <SelectValue placeholder="付款方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部方式</SelectItem>
              <SelectItem value="CASH">現金</SelectItem>
              <SelectItem value="BANK_TRANSFER">銀行轉帳</SelectItem>
              <SelectItem value="CREDIT_CARD">信用卡</SelectItem>
              <SelectItem value="CHECK">支票</SelectItem>
              <SelectItem value="OTHER">其他</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="PENDING">待確認</SelectItem>
              <SelectItem value="CONFIRMED">已確認</SelectItem>
              <SelectItem value="CANCELLED">已作廢</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 收款列表 */}
      {payments.length === 0 ? (
        <Card className="p-12 text-center">
          <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">尚無收款記錄</p>
          <Button onClick={() => router.push("/payments-in/new")}>
            <Plus className="h-4 w-4 mr-2" />
            新增第一筆收款
          </Button>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/payments-in/${payment.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-lg">
                      {payment.paymentNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      {payment.customerName}
                    </p>
                    {payment.event && (
                      <p className="text-sm text-gray-500">
                        場次：{payment.event.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      +${payment.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.paymentDate).toLocaleDateString(
                        "zh-TW"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline">
                    {categoryLabels[payment.paymentCategory]}
                  </Badge>
                  <Badge variant="outline">
                    {methodLabels[payment.paymentMethod]}
                  </Badge>
                  <Badge
                    variant={
                      payment.status === "CONFIRMED"
                        ? "default"
                        : payment.status === "CANCELLED"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {statusLabels[payment.status]}
                  </Badge>
                  {payment.receiptNumber && (
                    <Badge variant="outline">
                      收據：{payment.receiptNumber}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
