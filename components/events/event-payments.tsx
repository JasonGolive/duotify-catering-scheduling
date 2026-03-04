"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  paymentCategory: string;
  status: string;
  receiptNumber: string | null;
  customerName: string;
}

interface PaymentStats {
  depositTotal: number;
  finalTotal: number;
  additionalTotal: number;
  totalReceived: number;
  depositCount: number;
  finalCount: number;
  additionalCount: number;
  totalCount: number;
}

interface EventPaymentsProps {
  eventId: string;
  eventName: string;
  contactName?: string;
  contactPhone?: string;
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

export function EventPayments({
  eventId,
  eventName,
  contactName,
  contactPhone,
}: EventPaymentsProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [eventId]);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/v1/events/${eventId}/payments`);
      if (!res.ok) throw new Error("載入失敗");

      const data = await res.json();
      setPayments(data.payments);
      setStats(data.stats);
    } catch (error) {
      toast.error("載入收款資料失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = (category: "DEPOSIT" | "FINAL_PAYMENT") => {
    // 使用 URL 參數傳遞場次資訊
    const params = new URLSearchParams({
      eventId,
      eventName,
      category,
      ...(contactName && { customerName: contactName }),
      ...(contactPhone && { customerPhone: contactPhone }),
    });
    router.push(`/payments-in/new?${params.toString()}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">載入中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 收款統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">訂金</p>
              {stats && stats.depositCount > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                ${stats?.depositTotal.toLocaleString() || 0}
              </p>
              {stats && stats.depositCount > 0 && (
                <span className="text-xs text-gray-500">
                  ({stats.depositCount} 筆)
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3"
              onClick={() => handleAddPayment("DEPOSIT")}
            >
              <Plus className="h-3 w-3 mr-1" />
              登記訂金
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">尾款</p>
              {stats && stats.finalCount > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                ${stats?.finalTotal.toLocaleString() || 0}
              </p>
              {stats && stats.finalCount > 0 && (
                <span className="text-xs text-gray-500">
                  ({stats.finalCount} 筆)
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3"
              onClick={() => handleAddPayment("FINAL_PAYMENT")}
            >
              <Plus className="h-3 w-3 mr-1" />
              登記尾款
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">總收款</p>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-green-600">
                ${stats?.totalReceived.toLocaleString() || 0}
              </p>
              {stats && stats.totalCount > 0 && (
                <span className="text-xs text-gray-500">
                  ({stats.totalCount} 筆)
                </span>
              )}
            </div>
            {stats && stats.additionalTotal > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                含追加款 ${stats.additionalTotal.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 收款記錄列表 */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">收款記錄</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/payments-in/${payment.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{payment.paymentNumber}</p>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[payment.paymentCategory]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {payment.customerName} •{" "}
                      {new Date(payment.paymentDate).toLocaleDateString(
                        "zh-TW"
                      )}{" "}
                      • {methodLabels[payment.paymentMethod]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      ${payment.amount.toLocaleString()}
                    </p>
                    {payment.receiptNumber && (
                      <p className="text-xs text-gray-500">
                        {payment.receiptNumber}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
