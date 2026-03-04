"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Trash2,
  XCircle,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  Building2,
  User,
  Phone,
} from "lucide-react";

interface PaymentIn {
  id: string;
  paymentNumber: string;
  customerName: string;
  customerPhone: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  paymentCategory: string;
  status: string;
  receiptNumber: string | null;
  checkNumber: string | null;
  transactionReference: string | null;
  notes: string | null;
  createdAt: string;
  event: {
    id: string;
    name: string;
    date: string;
    venue: {
      id: string;
      name: string;
    } | null;
  } | null;
  bankAccount: {
    id: string;
    accountName: string;
    bankName: string | null;
    accountNumber: string | null;
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

export default function PaymentInDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [payment, setPayment] = useState<PaymentIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayment();
  }, [params.id]);

  const fetchPayment = async () => {
    try {
      const res = await fetch(`/api/v1/payments-in/${params.id}`);
      if (!res.ok) throw new Error("載入失敗");

      const data = await res.json();
      setPayment(data);
    } catch (error) {
      toast.error("載入收款記錄失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("確定要作廢此收款記錄嗎？此操作將恢復銀行帳戶餘額。"))
      return;

    try {
      const res = await fetch(`/api/v1/payments-in/${params.id}/cancel`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "作廢失敗");
      }

      toast.success("收款記錄已作廢");
      fetchPayment();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "確定要刪除此收款記錄嗎？此操作無法恢復，且會恢復銀行帳戶餘額。"
      )
    )
      return;

    try {
      const res = await fetch(`/api/v1/payments-in/${params.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "刪除失敗");
      }

      toast.success("收款記錄已刪除");
      router.push("/payments-in");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="p-8">載入中...</div>;
  }

  if (!payment) {
    return <div className="p-8">找不到收款記錄</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* 標題列 */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{payment.paymentNumber}</h1>
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
              <Badge variant="outline">
                {categoryLabels[payment.paymentCategory]}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">{payment.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {payment.status === "CONFIRMED" && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/payments-in/${payment.id}/edit`)
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                編輯
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <XCircle className="h-4 w-4 mr-2" />
                作廢
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={payment.status === "CANCELLED"}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            刪除
          </Button>
        </div>
      </div>

      {/* 金額卡片 */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">收款金額</p>
            <p className="text-4xl font-bold text-green-600">
              ${payment.amount.toLocaleString()}
            </p>
          </div>
          <DollarSign className="h-16 w-16 text-green-600 opacity-50" />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 收款資訊 */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">收款資訊</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">客戶名稱</p>
                  <p className="font-medium">{payment.customerName}</p>
                </div>
              </div>

              {payment.customerPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">客戶電話</p>
                    <p className="font-medium">{payment.customerPhone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">收款日期</p>
                  <p className="font-medium">
                    {new Date(payment.paymentDate).toLocaleDateString("zh-TW")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">付款方式</p>
                  <p className="font-medium">
                    {methodLabels[payment.paymentMethod]}
                  </p>
                </div>
              </div>
            </div>

            {payment.bankAccount && (
              <div className="pt-4 border-t">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">銀行帳戶</p>
                    <p className="font-medium">
                      {payment.bankAccount.accountName}
                    </p>
                    {payment.bankAccount.bankName && (
                      <p className="text-sm text-gray-500">
                        {payment.bankAccount.bankName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {payment.transactionReference && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">轉帳序號</p>
                <p className="font-medium">{payment.transactionReference}</p>
              </div>
            )}

            {payment.checkNumber && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">支票號碼</p>
                <p className="font-medium">{payment.checkNumber}</p>
              </div>
            )}

            {payment.receiptNumber && (
              <div className="pt-4 border-t">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">收據號碼</p>
                    <p className="font-medium">{payment.receiptNumber}</p>
                  </div>
                </div>
              </div>
            )}

            {payment.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">備註</p>
                <p className="text-sm">{payment.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* 關聯場次 */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">關聯場次</h2>
          {payment.event ? (
            <div
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/events/${payment.event!.id}`)}
            >
              <p className="font-semibold mb-1">{payment.event.name}</p>
              <p className="text-sm text-gray-600">
                {new Date(payment.event.date).toLocaleDateString("zh-TW")}
              </p>
              {payment.event.venue && (
                <p className="text-sm text-gray-500 mt-2">
                  地點：{payment.event.venue.name}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">無關聯場次</p>
          )}

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-1">建立時間</p>
            <p className="text-sm">
              {new Date(payment.createdAt).toLocaleString("zh-TW")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
