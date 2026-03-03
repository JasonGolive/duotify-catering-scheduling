"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";

interface SalaryRuleCondition {
  dayOfWeek?: number[];
  holiday?: boolean;
  timeRange?: {
    start?: string;
    end?: string;
  };
  eventType?: string[];
  minHours?: number;
  isDriver?: boolean;
}

interface SalaryRule {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  condition: SalaryRuleCondition;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface RuleFormData {
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  condition: SalaryRuleCondition;
  isActive: boolean;
  priority: number;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "週日" },
  { value: 1, label: "週一" },
  { value: 2, label: "週二" },
  { value: 3, label: "週三" },
  { value: 4, label: "週四" },
  { value: 5, label: "週五" },
  { value: 6, label: "週六" },
];

const EVENT_TYPES = [
  { value: "婚宴", label: "婚宴" },
  { value: "尾牙", label: "尾牙" },
  { value: "春酒", label: "春酒" },
  { value: "生日宴", label: "生日宴" },
  { value: "公司活動", label: "公司活動" },
  { value: "其他", label: "其他" },
];

const emptyFormData: RuleFormData = {
  name: "",
  type: "FIXED",
  value: 0,
  condition: {},
  isActive: true,
  priority: 0,
};

export default function SalaryRulesPage() {
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SalaryRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<SalaryRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(emptyFormData);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/salary-rules");
      if (!response.ok) throw new Error("無法載入規則");
      const data = await response.json();
      setRules(data.rules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (rule: SalaryRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      value: rule.value,
      condition: rule.condition || {},
      isActive: rule.isActive,
      priority: rule.priority,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (rule: SalaryRule) => {
    setDeletingRule(rule);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const url = editingRule
        ? `/api/v1/salary-rules/${editingRule.id}`
        : "/api/v1/salary-rules";
      const method = editingRule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "儲存失敗");
      }

      setIsDialogOpen(false);
      fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/v1/salary-rules/${deletingRule.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "刪除失敗");
      }

      setIsDeleteDialogOpen(false);
      setDeletingRule(null);
      fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: SalaryRule) => {
    try {
      const response = await fetch(`/api/v1/salary-rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });

      if (!response.ok) {
        throw new Error("更新失敗");
      }

      fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    }
  };

  const handleDayOfWeekChange = (dayValue: number, checked: boolean) => {
    const currentDays = formData.condition.dayOfWeek || [];
    const newDays = checked
      ? [...currentDays, dayValue].sort((a, b) => a - b)
      : currentDays.filter((d) => d !== dayValue);
    
    setFormData({
      ...formData,
      condition: {
        ...formData.condition,
        dayOfWeek: newDays.length > 0 ? newDays : undefined,
      },
    });
  };

  const handleEventTypeChange = (eventValue: string, checked: boolean) => {
    const currentTypes = formData.condition.eventType || [];
    const newTypes = checked
      ? [...currentTypes, eventValue]
      : currentTypes.filter((t) => t !== eventValue);
    
    setFormData({
      ...formData,
      condition: {
        ...formData.condition,
        eventType: newTypes.length > 0 ? newTypes : undefined,
      },
    });
  };

  const formatConditions = (condition: SalaryRuleCondition): string => {
    const parts: string[] = [];
    
    if (condition.dayOfWeek && condition.dayOfWeek.length > 0) {
      const dayNames = condition.dayOfWeek.map(
        (d) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.label || ""
      );
      parts.push(`星期: ${dayNames.join(", ")}`);
    }
    
    if (condition.timeRange?.start || condition.timeRange?.end) {
      const start = condition.timeRange.start || "00:00";
      const end = condition.timeRange.end || "23:59";
      parts.push(`時間: ${start} - ${end}`);
    }
    
    if (condition.eventType && condition.eventType.length > 0) {
      parts.push(`活動: ${condition.eventType.join(", ")}`);
    }
    
    if (condition.minHours) {
      parts.push(`最低時數: ${condition.minHours}h`);
    }
    
    if (condition.isDriver) {
      parts.push("駕駛加給");
    }
    
    if (condition.holiday) {
      parts.push("假日");
    }
    
    return parts.length > 0 ? parts.join(" | ") : "無條件限制";
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>薪資規則管理</h1>
          <Button onClick={handleOpenCreate}>
            <Plus style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
            新增規則
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "1rem", color: "#dc2626" }}>
            {error}
          </div>
        )}

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle>現有規則</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                載入中...
              </div>
            ) : rules.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                尚無規則，請點擊「新增規則」建立
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名稱</TableHead>
                      <TableHead>類型</TableHead>
                      <TableHead style={{ textAlign: "right" }}>金額/百分比</TableHead>
                      <TableHead>條件</TableHead>
                      <TableHead style={{ textAlign: "center" }}>優先順序</TableHead>
                      <TableHead style={{ textAlign: "center" }}>狀態</TableHead>
                      <TableHead style={{ textAlign: "center" }}>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell style={{ fontWeight: 500 }}>{rule.name}</TableCell>
                        <TableCell>
                          <Badge variant={rule.type === "FIXED" ? "default" : "secondary"}>
                            {rule.type === "FIXED" ? "固定金額" : "百分比"}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          {rule.type === "FIXED"
                            ? `NT$ ${rule.value.toLocaleString()}`
                            : `${rule.value}%`}
                        </TableCell>
                        <TableCell style={{ maxWidth: "300px", fontSize: "0.875rem", color: "#6b7280" }}>
                          {formatConditions(rule.condition)}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>{rule.priority}</TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => handleToggleActive(rule)}
                          />
                        </TableCell>
                        <TableCell>
                          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(rule)}
                            >
                              <Edit style={{ width: "1rem", height: "1rem" }} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDelete(rule)}
                              style={{ color: "#dc2626" }}
                            >
                              <Trash2 style={{ width: "1rem", height: "1rem" }} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "編輯規則" : "新增規則"}
              </DialogTitle>
            </DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingTop: "1rem" }}>
              {/* 規則名稱 */}
              <div>
                <Label htmlFor="rule-name">規則名稱</Label>
                <Input
                  id="rule-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：週末加班費"
                  style={{ marginTop: "0.5rem" }}
                />
              </div>

              {/* 類型 & 金額 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <Label htmlFor="rule-type">類型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "PERCENTAGE" | "FIXED") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger style={{ marginTop: "0.5rem" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">固定金額</SelectItem>
                      <SelectItem value="PERCENTAGE">百分比</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rule-value">
                    {formData.type === "FIXED" ? "金額 (NT$)" : "百分比 (%)"}
                  </Label>
                  <Input
                    id="rule-value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    min={0}
                    style={{ marginTop: "0.5rem" }}
                  />
                </div>
              </div>

              {/* 條件設定 */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
                <h3 style={{ fontWeight: 500, marginBottom: "1rem" }}>條件設定</h3>
                
                {/* 星期幾適用 */}
                <div style={{ marginBottom: "1rem" }}>
                  <Label>星期幾適用</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem" }}>
                    {DAYS_OF_WEEK.map((day) => (
                      <label
                        key={day.value}
                        style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.condition.dayOfWeek?.includes(day.value) || false}
                          onChange={(e) => handleDayOfWeekChange(day.value, e.target.checked)}
                          style={{ width: "1rem", height: "1rem" }}
                        />
                        <span style={{ fontSize: "0.875rem" }}>{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 時間範圍 */}
                <div style={{ marginBottom: "1rem" }}>
                  <Label>時間範圍</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div>
                      <Input
                        type="time"
                        value={formData.condition.timeRange?.start || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            condition: {
                              ...formData.condition,
                              timeRange: {
                                ...formData.condition.timeRange,
                                start: e.target.value || undefined,
                              },
                            },
                          })
                        }
                        placeholder="開始時間"
                      />
                    </div>
                    <div>
                      <Input
                        type="time"
                        value={formData.condition.timeRange?.end || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            condition: {
                              ...formData.condition,
                              timeRange: {
                                ...formData.condition.timeRange,
                                end: e.target.value || undefined,
                              },
                            },
                          })
                        }
                        placeholder="結束時間"
                      />
                    </div>
                  </div>
                </div>

                {/* 活動類型 */}
                <div style={{ marginBottom: "1rem" }}>
                  <Label>活動類型</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem" }}>
                    {EVENT_TYPES.map((event) => (
                      <label
                        key={event.value}
                        style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.condition.eventType?.includes(event.value) || false}
                          onChange={(e) => handleEventTypeChange(event.value, e.target.checked)}
                          style={{ width: "1rem", height: "1rem" }}
                        />
                        <span style={{ fontSize: "0.875rem" }}>{event.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 最低時數 */}
                <div style={{ marginBottom: "1rem" }}>
                  <Label htmlFor="min-hours">最低時數</Label>
                  <Input
                    id="min-hours"
                    type="number"
                    value={formData.condition.minHours || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        condition: {
                          ...formData.condition,
                          minHours: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    min={0}
                    step={0.5}
                    placeholder="例如: 4"
                    style={{ marginTop: "0.5rem", maxWidth: "150px" }}
                  />
                </div>

                {/* 駕駛加給 */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.condition.isDriver || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          condition: {
                            ...formData.condition,
                            isDriver: e.target.checked || undefined,
                          },
                        })
                      }
                      style={{ width: "1rem", height: "1rem" }}
                    />
                    <span>駕駛加給</span>
                  </label>
                </div>
              </div>

              {/* 優先順序 & 啟用狀態 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <Label htmlFor="priority">優先順序</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    style={{ marginTop: "0.5rem" }}
                  />
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                    數字越大優先級越高
                  </p>
                </div>
                <div>
                  <Label>啟用狀態</Label>
                  <div style={{ marginTop: "0.75rem" }}>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.875rem" }}>
                      {formData.isActive ? "啟用" : "停用"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter style={{ marginTop: "1.5rem" }}>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.name}>
                {saving ? "儲存中..." : "儲存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent style={{ maxWidth: "400px" }}>
            <DialogHeader>
              <DialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertTriangle style={{ width: "1.25rem", height: "1.25rem", color: "#dc2626" }} />
                確認刪除
              </DialogTitle>
            </DialogHeader>
            <div style={{ padding: "1rem 0" }}>
              <p>
                確定要刪除規則「<strong>{deletingRule?.name}</strong>」嗎？
              </p>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.5rem" }}>
                此操作無法復原。
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingRule(null);
                }}
                disabled={saving}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? "刪除中..." : "確認刪除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
