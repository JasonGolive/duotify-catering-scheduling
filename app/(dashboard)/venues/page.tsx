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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">場地管理</h1>
          <p className="text-gray-500 text-sm mt-1">管理活動場地（民宿）資訊</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
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

                <div className="space-y-2">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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

                <div className="space-y-2">
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

                <div className="space-y-2">
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
                  <div className="flex items-center gap-2">
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

                <div className="flex justify-end gap-2 pt-4">
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
                      <div className="flex items-center gap-2">
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
                            <div className="text-sm text-gray-500">
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
                      <div className="flex justify-end gap-2">
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
