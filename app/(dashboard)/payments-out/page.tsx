"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  paymentCategory: string;
  payeeType: string;
  payeeName: string | null;
  status: string;
  staff: { name: string } | null;
  supplier: { name: string } | null;
  bankAccount: { accountName: string } | null;
}

const statusLabels: Record<string, string> = {
  PENDING: "待審核",
  APPROVED: "已審核",
  PAID: "已付款",
  CANCELLED: "已作廢",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  PAID: CheckCircle,
  CANCELLED: XCircle,
};

const categoryLabels: Record<string, string> = {
  SALARY: "薪資",
  INGREDIENT: "食材",
  RENT: "租金",
  UTILITIES: "水電",
  EQUIPMENT: "設備",
  OTHER: "其他",
};

const methodLabels: Record<string, string> = {
  CASH: "現金",
  BANK_TRANSFER: "銀行轉帳",
  CREDIT_CARD: "信用卡",
  CHECK: "支票",
  OTHER: "其他",
};

export default function PaymentsOutPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAmount: 0, totalCount: 0 });
  
  // 篩選狀態
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [categoryFilter, setCategoryFilter] = useState("__all__");

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, categoryFilter]);

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "__all__") params.append("status", statusFilter);
      if (categoryFilter !== "__all__") params.append("category", categoryFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/v1/payments-out?${params.toString()}`);
      if (!res.ok) throw new Error("載入失敗");

      const data = await res.json();
      setPayments(data.payments);
      setStats(data.stats);
    } catch (error) {
      toast.error("載入付款列表失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchPayments();
  };

  const getPayeeName = (payment: Payment) => {
    if (payment.staff) return payment.staff.name;
    if (payment.supplier) return payment.supplier.name;
    return payment.payeeName || "未知";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* 標題與新增按鈕 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">應付管理</h1>
          <p className="text-gray-500 mt-1">管理所有支出和付款</p>
        </div>
        <Button onClick={() => router.push("/payments-out/new")}>
          <Plus className="h-4 w-4 mr-2" />
          新增付款
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">總支出</p>
              <p className="text-3xl font-bold text-red-600">
                ${stats.totalAmount.toLocaleString()}
              </p>
            </div>
            <FileText className="h-12 w-12 text-red-200" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">付款筆數</p>
              <p className="text-3xl font-bold">{stats.totalCount}</p>
            </div>
            <AlertCircle className="h-12 w-12 text-blue-200" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待審核</p>
              <p className="text-3xl font-bold text-yellow-600">
                {payments.filter((p) => p.status === "PENDING").length}
              </p>
            </div>
            <Clock className="h-12 w-12 text-yellow-200" />
          </div>
        </Card>
      </div>

      {/* 篩選與搜尋 */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="flex gap-2">
              <Input
                placeholder="搜尋付款單號、收款對象..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部狀態</SelectItem>
              <SelectItem value="PENDING">待審核</SelectItem>
              <SelectItem value="APPROVED">已審核</SelectItem>
              <SelectItem value="PAID">已付款</SelectItem>
              <SelectItem value="CANCELLED">已作廢</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="類別" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部類別</SelectItem>
              <SelectItem value="SALARY">薪資</SelectItem>
              <SelectItem value="INGREDIENT">食材</SelectItem>
              <SelectItem value="RENT">租金</SelectItem>
              <SelectItem value="UTILITIES">水電</SelectItem>
              <SelectItem value="EQUIPMENT">設備</SelectItem>
              <SelectItem value="OTHER">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 付款列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">付款單號</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">日期</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">收款對象</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">類別</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">金額</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">狀態</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    載入中...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    沒有付款記錄
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const StatusIcon = statusIcons[payment.status];
                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/payments-out/${payment.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {payment.paymentNumber}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(payment.paymentDate).toLocaleDateString("zh-TW")}
                      </td>
                      <td className="px-4 py-3 text-sm">{getPayeeName(payment)}</td>
                      <td className="px-4 py-3 text-sm">
                        {categoryLabels[payment.paymentCategory]}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600">
                        ${payment.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${statusColors[payment.status]} flex items-center gap-1 w-fit`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusLabels[payment.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/payments-out/${payment.id}`);
                          }}
                        >
                          查看
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
