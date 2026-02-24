"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const eventFormSchema = z.object({
  name: z.string().min(1, "活動名稱為必填").max(200, "活動名稱不能超過 200 個字元"),
  date: z.string().min(1, "日期為必填"),
  startTime: z.string().optional(),
  venueId: z.string().optional(),
  location: z.string().min(1, "地點為必填").max(200, "地點不能超過 200 個字元"),
  address: z.string().optional(),
  adultsCount: z.number().int().min(0).max(10000).optional().nullable(),
  childrenCount: z.number().int().min(0).max(10000).optional().nullable(),
  vegetarianCount: z.number().int().min(0).max(10000).optional().nullable(),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  eventType: z.enum(["WEDDING", "YEAREND", "SPRING", "BIRTHDAY", "CORPORATE", "OTHER"]),
  totalAmount: z.number().min(0).optional().nullable(),
  depositAmount: z.number().min(0).optional().nullable(),
  depositMethod: z.enum(["TRANSFER", "CASH", "HOTEL_PAID", "OTHER"]).optional().nullable(),
  depositDate: z.string().optional(),
  balanceAmount: z.number().min(0).optional().nullable(),
  balanceMethod: z.enum(["TRANSFER", "CASH", "HOTEL_PAID", "OTHER"]).optional().nullable(),
  balanceDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface Venue {
  id: string;
  name: string;
  address?: string;
}

const eventTypeLabels: Record<string, string> = {
  WEDDING: "婚宴",
  YEAREND: "尾牙",
  SPRING: "春酒",
  BIRTHDAY: "生日宴",
  CORPORATE: "企業活動",
  OTHER: "其他",
};

const eventStatusLabels: Record<string, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  IN_PROGRESS: "進行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const paymentMethodLabels: Record<string, string> = {
  TRANSFER: "匯款",
  CASH: "現金",
  HOTEL_PAID: "民宿代付",
  OTHER: "其他",
};

interface EventFormProps {
  initialData?: Partial<EventFormValues>;
  onSubmit: (data: EventFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function EventForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EventFormProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [showNewVenue, setShowNewVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueAddress, setNewVenueAddress] = useState("");

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      date: initialData?.date || "",
      startTime: initialData?.startTime || "",
      venueId: initialData?.venueId || "",
      location: initialData?.location || "",
      address: initialData?.address || "",
      adultsCount: initialData?.adultsCount ?? undefined,
      childrenCount: initialData?.childrenCount ?? undefined,
      vegetarianCount: initialData?.vegetarianCount ?? undefined,
      contactName: initialData?.contactName || "",
      contactPhone: initialData?.contactPhone || "",
      eventType: initialData?.eventType || "OTHER",
      totalAmount: initialData?.totalAmount ?? undefined,
      depositAmount: initialData?.depositAmount ?? undefined,
      depositMethod: initialData?.depositMethod || undefined,
      depositDate: initialData?.depositDate || "",
      balanceAmount: initialData?.balanceAmount ?? undefined,
      balanceMethod: initialData?.balanceMethod || undefined,
      balanceDate: initialData?.balanceDate || "",
      notes: initialData?.notes || "",
      status: initialData?.status || "PENDING",
    },
  });

  // Fetch venues on mount
  useEffect(() => {
    fetch("/api/v1/venues")
      .then((res) => res.json())
      .then((data) => setVenues(data))
      .catch((err) => console.error("Error fetching venues:", err));
  }, []);

  // Auto-calculate balance when total or deposit changes
  const totalAmount = form.watch("totalAmount");
  const depositAmount = form.watch("depositAmount");

  useEffect(() => {
    if (totalAmount && depositAmount) {
      const balance = totalAmount - depositAmount;
      if (balance >= 0) {
        form.setValue("balanceAmount", balance);
      }
    }
  }, [totalAmount, depositAmount, form]);

  // Handle venue selection
  const handleVenueChange = (venueId: string) => {
    if (venueId === "NEW") {
      setShowNewVenue(true);
      form.setValue("venueId", "");
    } else {
      const venue = venues.find((v) => v.id === venueId);
      if (venue) {
        form.setValue("venueId", venueId);
        form.setValue("location", venue.name);
        form.setValue("address", venue.address || "");
      }
      setShowNewVenue(false);
    }
  };

  // Add new venue
  const handleAddVenue = async () => {
    if (!newVenueName.trim()) return;

    try {
      const res = await fetch("/api/v1/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newVenueName, address: newVenueAddress }),
      });
      if (res.ok) {
        const newVenue = await res.json();
        setVenues([...venues, newVenue]);
        form.setValue("venueId", newVenue.id);
        form.setValue("location", newVenue.name);
        form.setValue("address", newVenue.address || "");
        setShowNewVenue(false);
        setNewVenueName("");
        setNewVenueAddress("");
      }
    } catch (error) {
      console.error("Error adding venue:", error);
    }
  };

  const handleSubmit = async (data: EventFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 基本資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>活動名稱 *</FormLabel>
                  <FormControl>
                    <Input placeholder="王先生婚宴" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>日期 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始時間</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活動類型 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇類型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(eventTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>狀態 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇狀態" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(eventStatusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 場地資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>場地資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormItem>
              <FormLabel>選擇常用場地</FormLabel>
              <Select
                onValueChange={handleVenueChange}
                value={form.watch("venueId") || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇場地或新增" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="NEW">+ 新增場地</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            {showNewVenue && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <Input
                  placeholder="場地名稱"
                  value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                />
                <Input
                  placeholder="場地地址"
                  value={newVenueAddress}
                  onChange={(e) => setNewVenueAddress(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleAddVenue}>
                    儲存場地
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewVenue(false)}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>地點名稱 *</FormLabel>
                  <FormControl>
                    <Input placeholder="場地名稱" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>詳細地址</FormLabel>
                  <FormControl>
                    <Textarea placeholder="詳細地址..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 訂餐人數 */}
        <Card>
          <CardHeader>
            <CardTitle>訂餐人數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="adultsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>大人</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="childrenCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>小孩</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vegetarianCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>素食</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 聯絡人 */}
        <Card>
          <CardHeader>
            <CardTitle>聯絡人</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>聯絡人姓名</FormLabel>
                    <FormControl>
                      <Input placeholder="王先生" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>聯絡人電話</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="0912-345-678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 金額與付款 */}
        <Card>
          <CardHeader>
            <CardTitle>金額與付款</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>訂單總金額 (TWD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 訂金 */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">訂金</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>金額 (TWD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depositMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>支付方式</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(paymentMethodLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depositDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>支付日期</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 尾款 */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">尾款</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="balanceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>金額 (TWD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="balanceMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>支付方式</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(paymentMethodLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="balanceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>支付日期</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                ※ 當尾款支付完成時，狀態會自動變更為「已完成」
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 備註 */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>備註</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="活動備註..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? "儲存中..." : initialData?.name ? "更新活動" : "新增活動"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              取消
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
