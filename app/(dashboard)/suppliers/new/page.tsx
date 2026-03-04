"use client";

import { useState } from "react";
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

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierCode: "",
    name: "",
    category: "INGREDIENT",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxId: "",
    paymentTerms: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/v1/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "新增失敗");
      }

      toast.success("供應商新增成功");
      router.push("/suppliers");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-3xl font-bold">新增供應商</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">基本資訊</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierCode">供應商編號</Label>
                <Input
                  id="supplierCode"
                  placeholder="選填，例如：SUP001"
                  value={formData.supplierCode}
                  onChange={(e) =>
                    setFormData({ ...formData, supplierCode: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="name">
                  供應商名稱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="例如：美味食材行"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">
                  類別 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INGREDIENT">食材</SelectItem>
                    <SelectItem value="EQUIPMENT">設備</SelectItem>
                    <SelectItem value="SERVICE">服務</SelectItem>
                    <SelectItem value="OTHER">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="taxId">統一編號</Label>
                <Input
                  id="taxId"
                  placeholder="8 位數字"
                  value={formData.taxId}
                  onChange={(e) =>
                    setFormData({ ...formData, taxId: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">聯絡資訊</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPerson">聯絡人</Label>
                <Input
                  id="contactPerson"
                  placeholder="例如：王小明"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">電話</Label>
                <Input
                  id="phone"
                  placeholder="例如：02-12345678"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="例如：contact@supplier.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">地址</Label>
                <Input
                  id="address"
                  placeholder="例如：台北市信義區..."
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">付款資訊</h2>
            <div>
              <Label htmlFor="paymentTerms">付款條件</Label>
              <Input
                id="paymentTerms"
                placeholder="例如：月結 30 天"
                value={formData.paymentTerms}
                onChange={(e) =>
                  setFormData({ ...formData, paymentTerms: e.target.value })
                }
              />
            </div>
          </div>

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

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "建立中..." : "建立供應商"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
