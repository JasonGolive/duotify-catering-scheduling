"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, ArrowLeft, Copy, FileText } from "lucide-react";
import { toast } from "sonner";

interface TemplateItem {
  id: string;
  menuItemId: string;
  quantity: number;
  sortOrder: number;
  notes?: string;
  menuItem: {
    id: string;
    name: string;
    category: string;
    unit: string;
  };
}

interface MenuTemplate {
  id: string;
  name: string;
  type: string;
  description?: string;
  version: number;
  isActive: boolean;
  items: TemplateItem[];
  _count: { eventMenus: number };
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  unit: string;
}

const TYPE_LABELS: Record<string, string> = {
  BBQ: "燒烤",
  WINE: "餐酒",
  ITALIAN_FRENCH: "義法",
  MIXED: "混合",
  CUSTOM: "客製",
};

const TYPE_COLORS: Record<string, string> = {
  BBQ: "#fef3c7",
  WINE: "#fce7f3",
  ITALIAN_FRENCH: "#dbeafe",
  MIXED: "#d1fae5",
  CUSTOM: "#f3f4f6",
};

export default function MenuTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MenuTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "MIXED",
    description: "",
    items: [] as Array<{ menuItemId: string; quantity: number; sortOrder: number; notes?: string }>,
  });

  useEffect(() => {
    fetchTemplates();
    fetchMenuItems();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/v1/menu/templates");
      const data = await response.json();

      if (response.ok) {
        setTemplates(data.templates);
      } else {
        toast.error(data.error || "載入失敗");
      }
    } catch (error) {
      toast.error("載入失敗");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/v1/menu/items?isActive=true");
      const data = await response.json();
      if (response.ok) {
        setMenuItems(data.items);
      }
    } catch (error) {
      console.error("Failed to fetch menu items");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTemplate
        ? `/api/v1/menu/templates/${editingTemplate.id}`
        : "/api/v1/menu/templates";
      const method = editingTemplate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingTemplate ? "範本已更新" : "範本已新增");
        fetchTemplates();
        resetForm();
      } else {
        toast.error(data.error || "操作失敗");
      }
    } catch (error) {
      toast.error("操作失敗");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/menu/templates/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("範本已複製");
        fetchTemplates();
      } else {
        toast.error(data.error || "複製失敗");
      }
    } catch (error) {
      toast.error("複製失敗");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此範本嗎？")) return;

    try {
      const response = await fetch(`/api/v1/menu/templates/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.deactivated ? "範本已停用" : "範本已刪除");
        fetchTemplates();
      } else {
        toast.error(data.error || "刪除失敗");
      }
    } catch (error) {
      toast.error("刪除失敗");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      name: "",
      type: "MIXED",
      description: "",
      items: [],
    });
  };

  const startEdit = (template: MenuTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      description: template.description || "",
      items: template.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: Number(item.quantity),
        sortOrder: item.sortOrder,
        notes: item.notes,
      })),
    });
    setShowForm(true);
  };

  const addItem = () => {
    if (menuItems.length === 0) {
      toast.error("請先新增品項");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { menuItemId: menuItems[0].id, quantity: 1, sortOrder: prev.items.length },
      ],
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

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
            菜單範本
          </h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            共 {templates.length} 個範本
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} style={{ backgroundColor: "#8BA4BC" }}>
          <Plus style={{ width: "16px", height: "16px", marginRight: "6px" }} />
          新增範本
        </Button>
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
          <Card style={{ width: "100%", maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }}>
            <CardHeader>
              <CardTitle>{editingTemplate ? "編輯範本" : "新增範本"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
                        範本名稱 *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="例：標準 BBQ 套餐"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
                        類型 *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                        }}
                      >
                        {Object.entries(TYPE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
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

                  {/* Items */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <label style={{ fontWeight: 500 }}>品項清單</label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus style={{ width: "14px", height: "14px", marginRight: "4px" }} />
                        新增品項
                      </Button>
                    </div>
                    {formData.items.length === 0 ? (
                      <p style={{ color: "#9ca3af", fontSize: "14px" }}>尚未加入品項</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {formData.items.map((item, index) => (
                          <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <select
                              value={item.menuItemId}
                              onChange={(e) => updateItem(index, "menuItemId", e.target.value)}
                              style={{
                                flex: 2,
                                padding: "8px 12px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                              }}
                            >
                              {menuItems.map((mi) => (
                                <option key={mi.id} value={mi.id}>
                                  {mi.name} ({mi.unit})
                                </option>
                              ))}
                            </select>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="每人份量"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 1)}
                              style={{ flex: 1 }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
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
                      {editingTemplate ? "更新" : "新增"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Templates Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
        gap: "16px" 
      }}>
        {templates.length === 0 ? (
          <Card style={{ gridColumn: "1 / -1" }}>
            <CardContent style={{ padding: "48px", textAlign: "center" }}>
              <FileText style={{ width: "48px", height: "48px", color: "#9ca3af", margin: "0 auto 16px" }} />
              <p style={{ color: "#6b7280" }}>尚無範本</p>
              <Button
                onClick={() => setShowForm(true)}
                style={{ marginTop: "16px", backgroundColor: "#8BA4BC" }}
              >
                建立第一個範本
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} style={{ opacity: template.isActive ? 1 : 0.6 }}>
              <CardHeader style={{ paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: TYPE_COLORS[template.type] || "#f3f4f6",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {TYPE_LABELS[template.type] || template.type}
                  </div>
                  <div style={{ flex: 1 }}>
                    <CardTitle style={{ fontSize: "16px" }}>
                      {template.name}
                      {!template.isActive && (
                        <span style={{ marginLeft: "8px", color: "#dc2626", fontSize: "12px" }}>
                          (已停用)
                        </span>
                      )}
                    </CardTitle>
                    <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                      v{template.version} • 使用 {template._count.eventMenus} 次
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px" }}>
                    {template.description}
                  </p>
                )}
                <div style={{ fontSize: "13px", color: "#374151", marginBottom: "12px" }}>
                  {template.items.length} 個品項
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  {template.items.slice(0, 5).map((item) => (
                    <span
                      key={item.id}
                      style={{
                        padding: "2px 8px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {item.menuItem.name}
                    </span>
                  ))}
                  {template.items.length > 5 && (
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                      +{template.items.length - 5} 更多
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button variant="outline" size="sm" onClick={() => startEdit(template)}>
                    <Edit style={{ width: "14px", height: "14px", marginRight: "4px" }} />
                    編輯
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(template.id)}>
                    <Copy style={{ width: "14px", height: "14px", marginRight: "4px" }} />
                    複製
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    style={{ color: "#dc2626", borderColor: "#fecaca" }}
                  >
                    <Trash2 style={{ width: "14px", height: "14px" }} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
