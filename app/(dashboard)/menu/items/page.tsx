"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface BOMItem {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  defaultQuantityPerPerson: number;
  description?: string;
  isActive: boolean;
  bomItems: BOMItem[];
}

const CATEGORY_LABELS: Record<string, string> = {
  APPETIZER: "前菜",
  MAIN: "主菜",
  SIDE: "配菜",
  SOUP: "湯品",
  SALAD: "沙拉",
  DESSERT: "甜點",
  BEVERAGE: "飲品",
  OTHER: "其他",
};

const CATEGORY_COLORS: Record<string, string> = {
  APPETIZER: "#fef3c7",
  MAIN: "#fee2e2",
  SIDE: "#dbeafe",
  SOUP: "#d1fae5",
  SALAD: "#dcfce7",
  DESSERT: "#fce7f3",
  BEVERAGE: "#e0e7ff",
  OTHER: "#f3f4f6",
};

export default function MenuItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "MAIN",
    unit: "份",
    defaultQuantityPerPerson: 1,
    description: "",
    bomItems: [] as Array<{ ingredientName: string; quantity: number; unit: string; notes?: string }>,
  });

  useEffect(() => {
    fetchItems();
  }, [categoryFilter]);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      
      const response = await fetch(`/api/v1/menu/items?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.items);
      } else {
        toast.error(data.error || "載入失敗");
      }
    } catch (error) {
      toast.error("載入失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingItem
        ? `/api/v1/menu/items/${editingItem.id}`
        : "/api/v1/menu/items";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingItem ? "品項已更新" : "品項已新增");
        fetchItems();
        resetForm();
      } else {
        toast.error(data.error || "操作失敗");
      }
    } catch (error) {
      toast.error("操作失敗");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此品項嗎？")) return;

    try {
      const response = await fetch(`/api/v1/menu/items/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.deactivated ? "品項已停用" : "品項已刪除");
        fetchItems();
      } else {
        toast.error(data.error || "刪除失敗");
      }
    } catch (error) {
      toast.error("刪除失敗");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: "",
      category: "MAIN",
      unit: "份",
      defaultQuantityPerPerson: 1,
      description: "",
      bomItems: [],
    });
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      defaultQuantityPerPerson: item.defaultQuantityPerPerson,
      description: item.description || "",
      bomItems: item.bomItems.map((b) => ({
        ingredientName: b.ingredientName,
        quantity: Number(b.quantity),
        unit: b.unit,
        notes: b.notes,
      })),
    });
    setShowForm(true);
  };

  const addBOMItem = () => {
    setFormData((prev) => ({
      ...prev,
      bomItems: [...prev.bomItems, { ingredientName: "", quantity: 0, unit: "g" }],
    }));
  };

  const updateBOMItem = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      bomItems: prev.bomItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeBOMItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      bomItems: prev.bomItems.filter((_, i) => i !== index),
    }));
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <Button
          variant="ghost"
          onClick={() => router.push("/menu")}
          style={{ padding: "8px" }}
        >
          <ArrowLeft style={{ width: "20px", height: "20px" }} />
        </Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827" }}>
            品項主檔
          </h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            共 {items.length} 個品項
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} style={{ backgroundColor: "#8BA4BC" }}>
          <Plus style={{ width: "16px", height: "16px", marginRight: "6px" }} />
          新增品項
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <Search style={{ 
            position: "absolute", 
            left: "12px", 
            top: "50%", 
            transform: "translateY(-50%)",
            width: "16px",
            height: "16px",
            color: "#9ca3af"
          }} />
          <Input
            placeholder="搜尋品項..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px" }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            minWidth: "120px",
          }}
        >
          <option value="">全部類別</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "24px",
        }}>
          <Card style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflow: "auto" }}>
            <CardHeader>
              <CardTitle>{editingItem ? "編輯品項" : "新增品項"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
                      品項名稱 *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
                        類別 *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                        }}
                      >
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
                        單位 *
                      </label>
                      <Input
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="份、g、ml"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
                      每人預設份量
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.defaultQuantityPerPerson}
                      onChange={(e) => setFormData({ ...formData, defaultQuantityPerPerson: parseFloat(e.target.value) || 1 })}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
                      說明
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        minHeight: "60px",
                      }}
                    />
                  </div>

                  {/* BOM Section */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <label style={{ fontWeight: 500 }}>材料組成 (BOM)</label>
                      <Button type="button" variant="outline" size="sm" onClick={addBOMItem}>
                        <Plus style={{ width: "14px", height: "14px", marginRight: "4px" }} />
                        新增材料
                      </Button>
                    </div>
                    {formData.bomItems.length === 0 ? (
                      <p style={{ color: "#9ca3af", fontSize: "14px" }}>尚未設定材料</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {formData.bomItems.map((bom, index) => (
                          <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <Input
                              placeholder="材料名稱"
                              value={bom.ingredientName}
                              onChange={(e) => updateBOMItem(index, "ingredientName", e.target.value)}
                              style={{ flex: 2 }}
                            />
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="用量"
                              value={bom.quantity}
                              onChange={(e) => updateBOMItem(index, "quantity", parseFloat(e.target.value) || 0)}
                              style={{ flex: 1 }}
                            />
                            <Input
                              placeholder="單位"
                              value={bom.unit}
                              onChange={(e) => updateBOMItem(index, "unit", e.target.value)}
                              style={{ flex: 1 }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBOMItem(index)}
                              style={{ color: "#dc2626" }}
                            >
                              <Trash2 style={{ width: "14px", height: "14px" }} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      取消
                    </Button>
                    <Button type="submit" style={{ backgroundColor: "#8BA4BC" }}>
                      {editingItem ? "更新" : "新增"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Items List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent style={{ padding: "48px", textAlign: "center" }}>
              <p style={{ color: "#6b7280" }}>尚無品項</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} style={{ opacity: item.isActive ? 1 : 0.6 }}>
              <CardContent style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: CATEGORY_COLORS[item.category] || "#f3f4f6",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {CATEGORY_LABELS[item.category] || item.category}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: "#111827" }}>
                      {item.name}
                      {!item.isActive && (
                        <span style={{ marginLeft: "8px", color: "#dc2626", fontSize: "12px" }}>
                          (已停用)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      {item.defaultQuantityPerPerson} {item.unit}/人
                      {item.bomItems.length > 0 && ` • ${item.bomItems.length} 種材料`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    {expandedId === item.id ? (
                      <ChevronUp style={{ width: "16px", height: "16px" }} />
                    ) : (
                      <ChevronDown style={{ width: "16px", height: "16px" }} />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                    <Edit style={{ width: "16px", height: "16px" }} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    style={{ color: "#dc2626" }}
                  >
                    <Trash2 style={{ width: "16px", height: "16px" }} />
                  </Button>
                </div>

                {/* Expanded BOM */}
                {expandedId === item.id && item.bomItems.length > 0 && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "8px" }}>
                      材料組成：
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px" }}>
                      {item.bomItems.map((bom) => (
                        <div
                          key={bom.id}
                          style={{
                            padding: "8px",
                            backgroundColor: "#f9fafb",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        >
                          {bom.ingredientName}: {Number(bom.quantity)} {bom.unit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
