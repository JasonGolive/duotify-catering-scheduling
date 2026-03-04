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
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  DollarSign,
  Clock,
} from "lucide-react";

interface Supplier {
  id: string;
  supplierCode: string | null;
  name: string;
  category: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  payments: Payment[];
}

interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  paymentCategory: string;
  status: string;
  invoiceNumber: string | null;
  notes: string | null;
}

interface Stats {
  totalPaid: number;
  totalPending: number;
  paymentCount: number;
}

const categoryLabels: Record<string, string> = {
  INGREDIENT: "食材",
  EQUIPMENT: "設備",
  SERVICE: "服務",
  OTHER: "其他",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "啟用",
  INACTIVE: "停用",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "現金",
  BANK_TRANSFER: "銀行轉帳",
  CREDIT_CARD: "信用卡",
  CHECK: "支票",
  OTHER: "其他",
};

const paymentCategoryLabels: Record<string, string> = {
  SALARY: "薪資",
  INGREDIENT: "食材",
  RENT: "租金",
  UTILITIES: "水電",
  EQUIPMENT: "設備",
  OTHER: "其他",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "待審核",
  APPROVED: "已審核",
  PAID: "已付款",
  CANCELLED: "已取消",
};

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplier();
  }, [params.id]);

  const fetchSupplier = async () => {
    try {
      const res = await fetch(`/api/v1/suppliers/${params.id}`);
      if (!res.ok) throw new Error("載入失敗");

      const data = await res.json();
      setSupplier(data.supplier);
      setStats(data.stats);
    } catch (error) {
      toast.error("載入供應商資料失敗");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">載入中...</div>;
  }

  if (!supplier) {
    return <div className="p-8">找不到供應商</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{supplier.name}</h1>
              <Badge
                variant={
                  supplier.status === "ACTIVE" ? "default" : "secondary"
                }
              >
                {statusLabels[supplier.status]}
              </Badge>
              <Badge variant="outline">
                {categoryLabels[supplier.category]}
              </Badge>
            </div>
            {supplier.supplierCode && (
              <p className="text-gray-500 mt-1">{supplier.supplierCode}</p>
            )}
          </div>
        </div>
        <Button onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          編輯
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">已付款總額</p>
                <p className="text-2xl font-bold text-green-600">
                  ${stats.totalPaid.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">待付款金額</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${stats.totalPending.toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">付款記錄</p>
                <p className="text-2xl font-bold">{stats.paymentCount} 筆</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">供應商資訊</h2>
          <div className="space-y-4">
            {supplier.contactPerson && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">聯絡人</p>
                  <p className="font-medium">{supplier.contactPerson}</p>
                </div>
              </div>
            )}

            {supplier.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">電話</p>
                  <p className="font-medium">{supplier.phone}</p>
                </div>
              </div>
            )}

            {supplier.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{supplier.email}</p>
                </div>
              </div>
            )}

            {supplier.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">地址</p>
                  <p className="font-medium">{supplier.address}</p>
                </div>
              </div>
            )}

            {supplier.taxId && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">統一編號</p>
                  <p className="font-medium">{supplier.taxId}</p>
                </div>
              </div>
            )}

            {supplier.paymentTerms && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">付款條件</p>
                  <p className="font-medium">{supplier.paymentTerms}</p>
                </div>
              </div>
            )}

            {supplier.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">備註</p>
                <p className="text-sm">{supplier.notes}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">
            付款記錄（最近 20 筆）
          </h2>
          {supplier.payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              尚無付款記錄
            </div>
          ) : (
            <div className="space-y-3">
              {supplier.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/payments-out/${payment.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{payment.paymentNumber}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.paymentDate).toLocaleDateString(
                          "zh-TW"
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        -${payment.amount.toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          payment.status === "PAID" ? "default" : "secondary"
                        }
                      >
                        {paymentStatusLabels[payment.status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>
                      {paymentMethodLabels[payment.paymentMethod] || "未知"}
                    </span>
                    <span>•</span>
                    <span>
                      {paymentCategoryLabels[payment.paymentCategory] || "未知"}
                    </span>
                    {payment.invoiceNumber && (
                      <>
                        <span>•</span>
                        <span>發票：{payment.invoiceNumber}</span>
                      </>
                    )}
                  </div>
                  {payment.notes && (
                    <p className="text-sm text-gray-500 mt-2">
                      {payment.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
