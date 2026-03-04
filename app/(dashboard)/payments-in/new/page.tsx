"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Event {
  id: string;
  name: string;
  date: string;
}

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string | null;
}

export default function NewPaymentInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    eventId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "CASH",
    bankAccountId: "",
    checkNumber: "",
    transactionReference: "",
    paymentCategory: "DEPOSIT",
    receiptNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchEvents();
    fetchBankAccounts();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/v1/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("載入場次失敗:", error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await fetch("/api/v1/bank-accounts");
      if (res.ok) {
        const data = await res.json();
        setBankAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("載入銀行帳戶失敗:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        eventId: formData.eventId || null,
        amount: parseFloat(formData.amount),
        bankAccountId: formData.bankAccountId || null,
        checkNumber: formData.checkNumber || null,
        transactionReference: formData.transactionReference || null,
        receiptNumber: formData.receiptNumber || null,
        notes: formData.notes || null,
      };

      const res = await fetch("/api/v1/payments-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "新增失敗");
      }

      toast.success("收款記錄新增成功");
      router.push("/payments-in");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const needsBankAccount =
    formData.paymentMethod !== "CASH" && formData.paymentMethod !== "OTHER";

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-3xl font-bold">新增收款</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* 客戶資訊 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">客戶資訊</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">
                  客戶名稱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  placeholder="例如：王小明"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">客戶電話</Label>
                <Input
                  id="customerPhone"
                  placeholder="例如：0912-345-678"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="eventId">關聯場次（選填）</Label>
                <Select
                  value={formData.eventId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, eventId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇場次或留空" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">無關聯場次</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} -{" "}
                        {new Date(event.date).toLocaleDateString("zh-TW")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 收款資訊 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">收款資訊</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentDate">
                  收款日期 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">
                  金額 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="例如：50000"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="paymentCategory">
                  收款類別 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.paymentCategory}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentCategory: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEPOSIT">訂金</SelectItem>
                    <SelectItem value="FINAL_PAYMENT">尾款</SelectItem>
                    <SelectItem value="ADDITIONAL">追加款項</SelectItem>
                    <SelectItem value="REFUND">退款</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentMethod">
                  付款方式 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">現金</SelectItem>
                    <SelectItem value="BANK_TRANSFER">銀行轉帳</SelectItem>
                    <SelectItem value="CREDIT_CARD">信用卡</SelectItem>
                    <SelectItem value="CHECK">支票</SelectItem>
                    <SelectItem value="OTHER">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 付款細節 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">付款細節</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {needsBankAccount && (
                <div className="md:col-span-2">
                  <Label htmlFor="bankAccountId">
                    銀行帳戶 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.bankAccountId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bankAccountId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇收款帳戶" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName}
                          {account.bankName && ` - ${account.bankName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.paymentMethod === "BANK_TRANSFER" && (
                <div className="md:col-span-2">
                  <Label htmlFor="transactionReference">轉帳序號</Label>
                  <Input
                    id="transactionReference"
                    placeholder="例如：20231201-123456"
                    value={formData.transactionReference}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transactionReference: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {formData.paymentMethod === "CHECK" && (
                <div className="md:col-span-2">
                  <Label htmlFor="checkNumber">支票號碼</Label>
                  <Input
                    id="checkNumber"
                    placeholder="例如：AB1234567"
                    value={formData.checkNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, checkNumber: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <Label htmlFor="receiptNumber">收據號碼</Label>
                <Input
                  id="receiptNumber"
                  placeholder="例如：R-20231201-001"
                  value={formData.receiptNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, receiptNumber: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* 備註 */}
          <div>
            <Label htmlFor="notes">備註</Label>
            <Textarea
              id="notes"
              placeholder="其他說明..."
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "建立中..." : "建立收款"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
