"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AttachmentUpload } from "@/components/payments/attachment-upload";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  XCircle,
  Trash2,
  Clock,
  Building2,
  User,
  FileText,
} from "lucide-react";

interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  paymentCategory: string;
  payeeType: string;
  status: string;
  notes: string | null;
  invoiceNumber: string | null;
  checkNumber: string | null;
  transactionReference: string | null;
  staff: { name: string; phone: string | null } | null;
  supplier: { name: string; phone: string | null } | null;
  bankAccount: { accountName: string; bankName: string | null } | null;
  payeeName: string | null;
  approvedAt: string | null;
  createdAt: string;
  attachments: any[];
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

const payeeTypeLabels: Record<string, string> = {
  STAFF: "員工",
  SUPPLIER: "供應商",
  VENDOR: "廠商",
  OTHER: "其他",
};

export default function PaymentOutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPayment();
  }, [paymentId]);

  const fetchPayment = async () => {
    try {
      const res = await fetch(`/api/v1/payments-out/${paymentId}`);
      if (!res.ok) throw new Error("載入失敗");

      const data = await res.json();
      setPayment(data);
    } catch (error) {
      toast.error("載入付款資料失敗");
      router.push("/payments-out");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("確定要審核通過此付款嗎？")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/payments-out/${paymentId}/approve`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "審核失敗");
      }

      toast.success("付款已審核通過");
      fetchPayment();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "審核失敗");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    if (!confirm("確定要標記此付款為已付款嗎？銀行帳戶餘額將會扣除。")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/payments-out/${paymentId}/pay`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "付款失敗");
      }

      toast.success("付款已完成");
      fetchPayment();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "付款失敗");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("確定要作廢此付款嗎？如已付款，銀行餘額將會恢復。")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/payments-out/${paymentId}/cancel`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "作廢失敗");
      }

      toast.success("付款已作廢");
      fetchPayment();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "作廢失敗");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "確定要刪除此付款嗎？此操作無法復原。如已付款，銀行餘額將會恢復。"
      )
    )
      return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/payments-out/${paymentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("刪除失敗");

      toast.success("付款已刪除");
      router.push("/payments-out");
    } catch (error) {
      toast.error("刪除失敗");
    } finally {
      setActionLoading(false);
    }
  };

  const getPayeeName = () => {
    if (payment?.staff) return payment.staff.name;
    if (payment?.supplier) return payment.supplier.name;
    return payment?.payeeName || "未知";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  if (!payment) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{payment.paymentNumber}</h1>
            <p className="text-gray-500 mt-1">付款詳情</p>
          </div>
        </div>
        <Badge className={`${statusColors[payment.status]} text-lg px-4 py-2`}>
          {statusLabels[payment.status]}
        </Badge>
      </div>

      {/* 金額卡片 */}
      <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
        <CardContent className="p-8">
          <p className="text-red-100 mb-2">付款金額</p>
          <p className="text-5xl font-bold">${payment.amount.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-red-100">
            <span>{new Date(payment.paymentDate).toLocaleDateString("zh-TW")}</span>
            <span>•</span>
            <span>{methodLabels[payment.paymentMethod]}</span>
            <span>•</span>
            <span>{categoryLabels[payment.paymentCategory]}</span>
          </div>
        </CardContent>
      </Card>

      {/* 操作按鈕 */}
      {payment.status !== "CANCELLED" && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {payment.status === "PENDING" && (
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                審核通過
              </Button>
            )}

            {(payment.status === "PENDING" || payment.status === "APPROVED") && (
              <Button
                onClick={handlePay}
                disabled={actionLoading}
                variant="default"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4" />
                標記已付款
              </Button>
            )}

            <Button
              onClick={handleCancel}
              disabled={actionLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              作廢
            </Button>

            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              variant="destructive"
              className="flex items-center gap-2 ml-auto"
            >
              <Trash2 className="h-4 w-4" />
              刪除
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 收款對象資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              收款對象
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">對象類型</p>
              <p className="font-semibold">{payeeTypeLabels[payment.payeeType]}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">名稱</p>
              <p className="font-semibold">{getPayeeName()}</p>
            </div>
            {(payment.staff?.phone || payment.supplier?.phone) && (
              <div>
                <p className="text-sm text-gray-500">聯絡電話</p>
                <p>{payment.staff?.phone || payment.supplier?.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 付款資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              付款資訊
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">付款方式</p>
              <p className="font-semibold">{methodLabels[payment.paymentMethod]}</p>
            </div>
            {payment.bankAccount && (
              <div>
                <p className="text-sm text-gray-500">付款帳戶</p>
                <p className="font-semibold">
                  {payment.bankAccount.accountName}
                  {payment.bankAccount.bankName &&
                    ` - ${payment.bankAccount.bankName}`}
                </p>
              </div>
            )}
            {payment.transactionReference && (
              <div>
                <p className="text-sm text-gray-500">轉帳序號</p>
                <p>{payment.transactionReference}</p>
              </div>
            )}
            {payment.checkNumber && (
              <div>
                <p className="text-sm text-gray-500">支票號碼</p>
                <p>{payment.checkNumber}</p>
              </div>
            )}
            {payment.invoiceNumber && (
              <div>
                <p className="text-sm text-gray-500">發票號碼</p>
                <p>{payment.invoiceNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 備註 */}
      {payment.notes && (
        <Card>
          <CardHeader>
            <CardTitle>備註</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{payment.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* 附件管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            附件管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentUpload
            paymentId={payment.id}
            attachments={payment.attachments}
            onAttachmentAdded={fetchPayment}
            onAttachmentDeleted={fetchPayment}
          />
        </CardContent>
      </Card>

      {/* 時間資訊 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            時間記錄
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">建立時間：</span>
            <span>{new Date(payment.createdAt).toLocaleString("zh-TW")}</span>
          </div>
          {payment.approvedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">審核時間：</span>
              <span>{new Date(payment.approvedAt).toLocaleString("zh-TW")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
