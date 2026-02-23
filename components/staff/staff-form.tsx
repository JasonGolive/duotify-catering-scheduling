"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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

// Form schema - matches backend validation
const staffFormSchema = z.object({
  name: z
    .string()
    .min(1, "姓名為必填")
    .max(100, "姓名不能超過 100 個字元"),
  phone: z
    .string()
    .min(10, "電話號碼至少需要 10 位數字")
    .regex(/^[\d\s\-+()]+$/, "電話號碼格式不正確"),
  perEventSalary: z.number().positive("薪資必須為正數").max(1000000, "薪資不能超過 NT$1,000,000"),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

interface StaffFormProps {
  initialData?: Partial<StaffFormValues>;
  onSubmit: (data: StaffFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function StaffForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: StaffFormProps) {
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      perEventSalary: initialData?.perEventSalary || 0,
      notes: initialData?.notes || "",
      status: initialData?.status || "ACTIVE",
    },
  });

  const handleSubmit = async (data: StaffFormValues) => {
    // Ensure perEventSalary is a number
    const processedData = {
      ...data,
      perEventSalary: typeof data.perEventSalary === "string" 
        ? parseFloat(data.perEventSalary) || 0 
        : data.perEventSalary,
    };
    await onSubmit(processedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名 *</FormLabel>
              <FormControl>
                <Input placeholder="王小明" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電話 *</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="0912-345-678"
                  inputMode="tel"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                請輸入手機或市話號碼
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="perEventSalary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>每場薪資 (TWD) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="2000"
                  step="1"
                  inputMode="numeric"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormDescription>
                每場活動的薪資金額（新台幣）
              </FormDescription>
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
                  <SelectItem value="ACTIVE">在職</SelectItem>
                  <SelectItem value="INACTIVE">離職</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>備註</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="關於此員工的其他備註..."
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
            {isSubmitting ? "儲存中..." : initialData ? "更新員工" : "新增員工"}
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
