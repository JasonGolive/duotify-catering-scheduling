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
import { ArrowLeft } from "lucide-react";

interface Staff {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string | null;
}

export default function NewPaymentOutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "CASH",
    bankAccountId: "",
    checkNumber: "",
    transactionReference: "",
    paymentCategory: "INGREDIENT",
    payeeType: "SUPPLIER",
    staffId: "",
    supplierId: "",
    payeeName: "",
    invoiceNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [staffRes, suppliersRes, bankAccountsRes] = await Promise.all([
        fetch("/api/v1/staff"),
        fetch("/api/v1/suppliers"),
        fetch("/api/v1/bank-accounts?status=active"),
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff || staffData);
      }
      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData.suppliers || suppliersData);
      }
      if (bankAccountsRes.ok) {
        const bankAccountsData = await bankAccountsRes.json();
        setBankAccounts(bankAccountsData.accounts || bankAccountsData);
      }
    } catch (error) {
      console.error("載入選項失敗:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/v1/payments-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          bankAccountId: formData.bankAccountId || null,
          staffId: formData.payeeType === "STAFF" ? formData.staffId : null,
          supplierId: formData.payeeType === "SUPPLIER" ? formData.supplierId : null,
          payeeName: formData.payeeType === "OTHER" ? formData.payeeName : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "新增失敗");
      }

      const payment = await res.json();
      toast.success("付款已建立");
      router.push(`/payments-out/${payment.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "新增失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-3xl font-bold">新增付款</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* 付款資訊 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">付款資訊</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentDate">
                  付款日期 <span className="text-red-500">*</span>
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
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="paymentCategory">
                  付款類別 <span className="text-red-500">*</span>
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
                    <SelectItem value="SALARY">薪資</SelectItem>
                    <SelectItem value="INGREDIENT">食材</SelectItem>
                    <SelectItem value="RENT">租金</SelectItem>
                    <SelectItem value="UTILITIES">水電</SelectItem>
                    <SelectItem value="EQUIPMENT">設備</SelectItem>
                    <SelectItem value="OTHER">其他</SelectItem>
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

              {formData.paymentMethod !== "CASH" && (
                <div className="md:col-span-2">
                  <Label htmlFor="bankAccountId">銀行帳戶</Label>
                  <Select
                    value={formData.bankAccountId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bankAccountId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇付款帳戶" />
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
                    placeholder="例如：ATM123456789"
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
                    placeholder="例如：CH-123456"
                    value={formData.checkNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, checkNumber: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* 收款對象 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">收款對象</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="payeeType">
                  對象類型 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.payeeType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      payeeType: value,
                      staffId: "",
                      supplierId: "",
                      payeeName: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">員工</SelectItem>
                    <SelectItem value="SUPPLIER">供應商</SelectItem>
                    <SelectItem value="VENDOR">廠商</SelectItem>
                    <SelectItem value="OTHER">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.payeeType === "STAFF" && (
                <div>
                  <Label htmlFor="staffId">
                    選擇員工 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.staffId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, staffId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇員工" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.payeeType === "SUPPLIER" && (
                <div>
                  <Label htmlFor="supplierId">
                    選擇供應商 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, supplierId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇供應商" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(formData.payeeType === "VENDOR" ||
                formData.payeeType === "OTHER") && (
                <div>
                  <Label htmlFor="payeeName">
                    收款對象名稱 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="payeeName"
                    placeholder="輸入收款對象名稱"
                    value={formData.payeeName}
                    onChange={(e) =>
                      setFormData({ ...formData, payeeName: e.target.value })
                    }
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* 其他資訊 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">其他資訊</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invoiceNumber">發票號碼</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="例如：INV-2026-001"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNumber: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="notes">備註</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="其他說明或備註"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "建立中..." : "建立付款"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              取消
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
