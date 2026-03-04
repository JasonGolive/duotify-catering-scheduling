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
import { Plus, Search, Trash2, Building2, Phone, Mail } from "lucide-react";

interface Supplier {
  id: number;
  supplierCode: string | null;
  name: string;
  category: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  status: string;
  _count: {
    payments: number;
  };
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

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchSuppliers();
  }, [categoryFilter, statusFilter, search]);

  const fetchSuppliers = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/v1/suppliers?${params.toString()}`);
      if (!res.ok) throw new Error("載入失敗");

      const data = await res.json();
      setSuppliers(data.suppliers);
    } catch (error) {
      toast.error("載入供應商列表失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`確定要刪除供應商「${name}」嗎？`)) return;

    try {
      const res = await fetch(`/api/v1/suppliers/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "刪除失敗");
      }

      toast.success("供應商已刪除");
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const activeCount = suppliers.filter((s) => s.status === "ACTIVE").length;
  const inactiveCount = suppliers.filter((s) => s.status === "INACTIVE").length;

  if (loading) {
    return <div className="p-8">載入中...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', letterSpacing: '-0.025em' }}>供應商管理</h1>
          <p style={{ color: '#6b7280' }}>
            共 {suppliers.length} 個供應商（啟用 {activeCount} / 停用{" "}
            {inactiveCount}）
          </p>
        </div>
        <Button onClick={() => router.push("/suppliers/new")}>
          <Plus className="h-4 w-4 mr-2" />
          新增供應商
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜尋供應商名稱、編號、聯絡人..."
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
              <SelectItem value="INGREDIENT">食材</SelectItem>
              <SelectItem value="EQUIPMENT">設備</SelectItem>
              <SelectItem value="SERVICE">服務</SelectItem>
              <SelectItem value="OTHER">其他</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="ACTIVE">啟用</SelectItem>
              <SelectItem value="INACTIVE">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {suppliers.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">尚無供應商資料</p>
          <Button onClick={() => router.push("/suppliers/new")}>
            <Plus className="h-4 w-4 mr-2" />
            新增第一個供應商
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/suppliers/${supplier.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{supplier.name}</h3>
                  {supplier.supplierCode && (
                    <p className="text-sm text-gray-500">
                      {supplier.supplierCode}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
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
              </div>

              {supplier.contactPerson && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Building2 className="h-4 w-4" />
                  <span>{supplier.contactPerson}</span>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.phone}</span>
                </div>
              )}

              {supplier.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}

              <div className="pt-3 border-t flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  付款記錄 {supplier._count.payments} 筆
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(supplier.id, supplier.name);
                  }}
                  disabled={supplier._count.payments > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
