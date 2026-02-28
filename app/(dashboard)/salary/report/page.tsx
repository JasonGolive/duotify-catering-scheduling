"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Download, FileSpreadsheet, Users, Calendar, Clock } from "lucide-react";
import * as XLSX from "xlsx";

interface WorkLogItem {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  baseSalary: number;
  overtimePay: number;
  allowance: number;
  totalSalary: number;
  eventName?: string;
}

interface GroupSummary {
  key: string;
  label: string;
  count: number;
  totalHours: number;
  totalBaseSalary: number;
  totalOvertimePay: number;
  totalAllowance: number;
  totalSalary: number;
  items: WorkLogItem[];
}

interface ReportData {
  groupBy: string;
  groups: GroupSummary[];
  grandTotal: {
    count: number;
    totalHours: number;
    totalBaseSalary: number;
    totalOvertimePay: number;
    totalAllowance: number;
    totalSalary: number;
  };
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

interface Staff {
  id: string;
  name: string;
}

export default function SalaryReportPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  // 篩選條件
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().split("T")[0];
  });
  const [staffId, setStaffId] = useState<string>("");
  const [groupBy, setGroupBy] = useState<string>("staff");

  // 載入員工列表
  useEffect(() => {
    fetch("/api/v1/staff")
      .then((res) => res.json())
      .then((data) => setStaffList(data))
      .catch(console.error);
  }, []);

  // 載入報表
  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (staffId) params.append("staffId", staffId);
      params.append("groupBy", groupBy);

      const res = await fetch(`/api/v1/reports/salary?${params}`);
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error("Report error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 匯出 Excel
  const exportExcel = () => {
    if (!report) return;

    // 建立明細工作表
    const details: Array<Record<string, string | number>> = [];
    report.groups.forEach((group) => {
      group.items.forEach((item) => {
        details.push({
          員工: item.staffName,
          日期: item.date,
          集合時間: item.startTime,
          下班時間: item.endTime,
          時數: item.hours,
          基本薪資: item.baseSalary,
          加班費: item.overtimePay,
          補助: item.allowance,
          總計: item.totalSalary,
          活動: item.eventName || "",
        });
      });
    });

    // 建立統計工作表
    const summary = report.groups.map((g) => ({
      [groupBy === "staff" ? "員工" : "日期"]: g.label,
      場次: g.count,
      總時數: g.totalHours,
      基本薪資: g.totalBaseSalary,
      加班費: g.totalOvertimePay,
      補助: g.totalAllowance,
      總計: g.totalSalary,
    }));

    // 加入總計
    summary.push({
      [groupBy === "staff" ? "員工" : "日期"]: "總計",
      場次: report.grandTotal.count,
      總時數: report.grandTotal.totalHours,
      基本薪資: report.grandTotal.totalBaseSalary,
      加班費: report.grandTotal.totalOvertimePay,
      補助: report.grandTotal.totalAllowance,
      總計: report.grandTotal.totalSalary,
    });

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    const wsDetails = XLSX.utils.json_to_sheet(details);
    
    XLSX.utils.book_append_sheet(wb, wsSummary, "薪資統計");
    XLSX.utils.book_append_sheet(wb, wsDetails, "薪資明細");
    
    const fileName = `薪資報表_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col gap-6">
        {/* 標題 */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">薪資報表</h1>
          {report && (
            <Button onClick={exportExcel}>
              <Download className="h-4 w-4 mr-2" />
              匯出 Excel
            </Button>
          )}
        </div>

        {/* 篩選條件 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              查詢條件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="startDate">開始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">結束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="staffId">員工</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部員工" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部員工</SelectItem>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="groupBy">分組方式</Label>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">依員工</SelectItem>
                    <SelectItem value="date">依日期</SelectItem>
                    <SelectItem value="month">依月份</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={loadReport} disabled={loading} className="w-full">
                  {loading ? "查詢中..." : "查詢"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 總計卡片 */}
        {report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">場次</span>
                </div>
                <p className="text-2xl font-bold">{report.grandTotal.count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">總時數</span>
                </div>
                <p className="text-2xl font-bold">{report.grandTotal.totalHours}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">加班費</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  NT$ {report.grandTotal.totalOvertimePay.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="text-sm">總薪資</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  NT$ {report.grandTotal.totalSalary.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 分組統計 */}
        {report && (
          <Card>
            <CardHeader>
              <CardTitle>
                {groupBy === "staff" ? "員工" : groupBy === "date" ? "日期" : "月份"}統計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {report.groups.map((group) => (
                  <AccordionItem key={group.key} value={group.key}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 justify-between items-center pr-4">
                        <span className="font-medium">{group.label}</span>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{group.count} 場</span>
                          <span>{group.totalHours} 時</span>
                          <span className="text-green-600 font-medium">
                            NT$ {group.totalSalary.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>日期</TableHead>
                            {groupBy !== "staff" && <TableHead>員工</TableHead>}
                            <TableHead>時間</TableHead>
                            <TableHead className="text-right">時數</TableHead>
                            <TableHead className="text-right">基本</TableHead>
                            <TableHead className="text-right">加班</TableHead>
                            <TableHead className="text-right">補助</TableHead>
                            <TableHead className="text-right">總計</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.date}</TableCell>
                              {groupBy !== "staff" && (
                                <TableCell>{item.staffName}</TableCell>
                              )}
                              <TableCell>
                                {item.startTime} - {item.endTime}
                              </TableCell>
                              <TableCell className="text-right">{item.hours}</TableCell>
                              <TableCell className="text-right">
                                {item.baseSalary.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.overtimePay > 0 ? (
                                  <span className="text-orange-600">
                                    +{item.overtimePay.toLocaleString()}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.allowance > 0 ? (
                                  <span className="text-blue-600">
                                    +{item.allowance.toLocaleString()}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {item.totalSalary.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* 小計 */}
                          <TableRow className="bg-muted/50 font-medium">
                            <TableCell colSpan={groupBy !== "staff" ? 3 : 2}>小計</TableCell>
                            <TableCell className="text-right">{group.totalHours}</TableCell>
                            <TableCell className="text-right">
                              {group.totalBaseSalary.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-orange-600">
                              {group.totalOvertimePay.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-blue-600">
                              {group.totalAllowance.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {group.totalSalary.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* 無資料提示 */}
        {report && report.groups.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              查無資料，請調整查詢條件或先匯入打工記錄
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
