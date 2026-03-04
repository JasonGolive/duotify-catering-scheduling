"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewBankAccountPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    accountType: "CHECKING",
    currency: "TWD",
    initialBalance: "0",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/v1/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          initialBalance: parseFloat(formData.initialBalance) || 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "建立失敗");
      }

      toast.success("銀行帳戶建立成功");
      router.push("/bank-accounts");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "建立失敗");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/bank-accounts")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">新增銀行帳戶</h1>
          <p className="text-gray-500 text-sm">建立新的銀行帳戶或現金帳戶</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>帳戶資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account Name */}
            <div>
              <Label htmlFor="accountName">
                帳戶名稱 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
                placeholder="例：XX銀行營運帳戶"
                required
              />
            </div>

            {/* Account Type */}
            <div>
              <Label htmlFor="accountType">帳戶類型</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">支票帳戶</SelectItem>
                  <SelectItem value="SAVINGS">存款帳戶</SelectItem>
                  <SelectItem value="CASH">現金</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Name */}
            <div>
              <Label htmlFor="bankName">銀行名稱</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="例：中國信託商業銀行"
              />
            </div>

            {/* Account Number */}
            <div>
              <Label htmlFor="accountNumber">帳號</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
                placeholder="輸入帳號"
              />
            </div>

            {/* Currency */}
            <div>
              <Label htmlFor="currency">幣別</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWD">TWD (新台幣)</SelectItem>
                  <SelectItem value="USD">USD (美元)</SelectItem>
                  <SelectItem value="JPY">JPY (日圓)</SelectItem>
                  <SelectItem value="CNY">CNY (人民幣)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Initial Balance */}
            <div>
              <Label htmlFor="initialBalance">期初餘額</Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) =>
                  setFormData({ ...formData, initialBalance: e.target.value })
                }
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                輸入此帳戶的期初餘額（可為負數）
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="其他說明或備註"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/bank-accounts")}
            className="flex-1"
          >
            取消
          </Button>
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? "建立中..." : "建立帳戶"}
          </Button>
        </div>
      </form>
    </div>
  );
}
