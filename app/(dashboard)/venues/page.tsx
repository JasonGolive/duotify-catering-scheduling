"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PlusIcon, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Venue {
  id: string;
  name: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  equipment: string | null;
  notes: string | null;
  isActive: boolean;
  _count?: {
    events: number;
  };
}

export default function VenuesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contactName: "",
    contactPhone: "",
    equipment: "",
    notes: "",
    isActive: true,
  });

  const fetchVenues = async () => {
    try {
      const url = showInactive ? "/api/v1/venues?active=false" : "/api/v1/venues";
      const response = await fetch(url);
      if (!response.ok) throw new Error("取得場地列表失敗");
      const data = await response.json();
      setVenues(data);
    } catch (error) {
      toast.error("無法載入場地列表");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [showInactive]);

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      contactName: "",
      contactPhone: "",
      equipment: "",
      notes: "",
      isActive: true,
    });
    setEditingVenue(null);
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      address: venue.address || "",
      contactName: venue.contactName || "",
      contactPhone: venue.contactPhone || "",
      equipment: venue.equipment || "",
      notes: venue.notes || "",
      isActive: venue.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingVenue
        ? `/api/v1/venues/${editingVenue.id}`
        : "/api/v1/venues";
      const method = editingVenue ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("操作失敗");

      toast.success(editingVenue ? "場地已更新" : "場地已新增");
      setIsDialogOpen(false);
      resetForm();
      fetchVenues();
    } catch (error) {
      toast.error("操作失敗，請稍後再試");
    }
  };

  const handleDelete = async (venue: Venue) => {
    if (!confirm(`確定要${venue._count?.events ? "停用" : "刪除"}「${venue.name}」嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/venues/${venue.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("操作失敗");

      const result = await response.json();
      toast.success(result.message);
      fetchVenues();
    } catch (error) {
      toast.error("操作失敗，請稍後再試");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: '#6b7280' }}>載入中...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto', paddingTop: '1.5rem', paddingBottom: '1.5rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>場地管理</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>管理活動場地（民宿）資訊</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm">
              顯示已停用
            </Label>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="w-4 h-4 mr-2" />
                新增場地
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingVenue ? "編輯場地" : "新增場地"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Label htmlFor="name">場地名稱 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="例：陽明山民宿"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Label htmlFor="address">地址</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="完整地址"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Label htmlFor="contactName">聯絡人</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) =>
                        setFormData({ ...formData, contactName: e.target.value })
                      }
                      placeholder="聯絡人姓名"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Label htmlFor="contactPhone">聯絡電話</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPhone: e.target.value })
                      }
                      placeholder="電話號碼"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Label htmlFor="equipment">設備資訊</Label>
                  <Textarea
                    id="equipment"
                    value={formData.equipment}
                    onChange={(e) =>
                      setFormData({ ...formData, equipment: e.target.value })
                    }
                    placeholder="廚房設備、場地設施等"
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Label htmlFor="notes">注意事項</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="停車資訊、進場時間等"
                    rows={3}
                  />
                </div>

                {editingVenue && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                    <Label htmlFor="isActive">啟用中</Label>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '1rem' }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    取消
                  </Button>
                  <Button type="submit">
                    {editingVenue ? "更新" : "新增"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>場地名稱</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>聯絡人</TableHead>
                <TableHead>設備</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    尚無場地資料
                  </TableCell>
                </TableRow>
              ) : (
                venues.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell className="font-medium">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {venue.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {venue.address || "-"}
                    </TableCell>
                    <TableCell>
                      {venue.contactName && (
                        <div>
                          <div>{venue.contactName}</div>
                          {venue.contactPhone && (
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {venue.contactPhone}
                            </div>
                          )}
                        </div>
                      )}
                      {!venue.contactName && "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {venue.equipment || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={venue.isActive ? "default" : "secondary"}>
                        {venue.isActive ? "啟用中" : "已停用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(venue)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(venue)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
