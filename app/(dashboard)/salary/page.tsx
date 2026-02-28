"use client";

import { useState, useRef, useCallback } from "react";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Edit } from "lucide-react";
import * as XLSX from "xlsx";

interface PreviewRow {
  row: number;
  staffName: string;
  staffId?: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  baseSalary: number;
  overtimeMinutes: number;
  overtimePay: number;
  allowance: number;
  totalSalary: number;
  error?: string;
  notes?: string;
}

interface PreviewResult {
  preview: boolean;
  results: PreviewRow[];
  summary: {
    total: number;
    valid: number;
    errors: number;
    totalSalary: number;
  };
  config: {
    baseHours: number;
    overtimeInterval: number;
    overtimeRate: number;
  };
}

export default function SalaryPage() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [overtimeRate, setOvertimeRate] = useState(50);
  const [editingRow, setEditingRow] = useState<PreviewRow | null>(null);
  const [imported, setImported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 解析 Excel/CSV 檔案
  const parseFile = useCallback(async (file: File) => {
    return new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          resolve(json as Array<Record<string, unknown>>);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  }, []);

  // 上傳並預覽
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImported(false);
    try {
      const rows = await parseFile(file);
      
      const response = await fetch("/api/v1/worklogs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, overtimeRate }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "預覽失敗");
      }

      setPreview(result);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 確認匯入
  const handleConfirmImport = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      const response = await fetch("/api/v1/worklogs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: preview.results
            .filter((r) => !r.error)
            .map((r) => ({
              staffName: r.staffName,
              date: r.date,
              startTime: r.startTime,
              endTime: r.endTime,
              allowance: r.allowance,
              overtimeRate,
              notes: r.notes,
            })),
          confirm: true,
          overtimeRate,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "匯入失敗");
      }

      setImported(true);
      alert(`成功匯入 ${result.imported} 筆記錄，總薪資 NT$ ${result.totalSalary.toLocaleString()}`);
    } catch (err) {
      console.error("Import error:", err);
      alert(err instanceof Error ? err.message : "匯入失敗");
    } finally {
      setLoading(false);
    }
  };

  // 下載範本
  const downloadTemplate = () => {
    const template = [
      {
        員工姓名: "王小明",
        日期: "2026-03-01",
        集合時間: "09:00",
        下班時間: "14:00",
        補助: 200,
        備註: "開車",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "打工記錄");
    XLSX.writeFile(wb, "打工記錄範本.xlsx");
  };

  // 更新預覽中的某一筆
  const handleUpdateRow = (updatedRow: PreviewRow) => {
    if (!preview) return;
    
    const newResults = preview.results.map((r) =>
      r.row === updatedRow.row ? updatedRow : r
    );
    
    const validRows = newResults.filter((r) => !r.error);
    const totalSalary = validRows.reduce((sum, r) => sum + r.totalSalary, 0);
    
    setPreview({
      ...preview,
      results: newResults,
      summary: {
        ...preview.summary,
        totalSalary,
      },
    });
    setEditingRow(null);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col gap-6">
        {/* 標題與操作 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">薪資管理</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              下載範本
            </Button>
            <Button asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                匯入檔案
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </label>
            </Button>
          </div>
        </div>

        {/* 設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              薪資計算設定
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>基本時數</Label>
                <p className="text-sm text-muted-foreground">4 小時（固定）</p>
              </div>
              <div>
                <Label>加班計算單位</Label>
                <p className="text-sm text-muted-foreground">每 10 分鐘</p>
              </div>
              <div>
                <Label htmlFor="overtimeRate">每 10 分鐘加班費</Label>
                <Input
                  id="overtimeRate"
                  type="number"
                  value={overtimeRate}
                  onChange={(e) => setOvertimeRate(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              薪資計算：基本薪資（≤4小時）+ 加班費（超過4小時每10分鐘）+ 補助
            </p>
          </CardContent>
        </Card>

        {/* 預覽結果 */}
        {preview && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>預覽結果</CardTitle>
                <div className="flex gap-4 text-sm">
                  <span>
                    總筆數: <strong>{preview.summary.total}</strong>
                  </span>
                  <span className="text-green-600">
                    有效: <strong>{preview.summary.valid}</strong>
                  </span>
                  {preview.summary.errors > 0 && (
                    <span className="text-red-600">
                      錯誤: <strong>{preview.summary.errors}</strong>
                    </span>
                  )}
                  <span className="text-blue-600">
                    總薪資: <strong>NT$ {preview.summary.totalSalary.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>員工</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>集合時間</TableHead>
                      <TableHead>下班時間</TableHead>
                      <TableHead className="text-right">時數</TableHead>
                      <TableHead className="text-right">基本薪資</TableHead>
                      <TableHead className="text-right">加班費</TableHead>
                      <TableHead className="text-right">補助</TableHead>
                      <TableHead className="text-right">總計</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.results.map((row) => (
                      <TableRow
                        key={row.row}
                        className={row.error ? "bg-red-50" : ""}
                      >
                        <TableCell>{row.row}</TableCell>
                        <TableCell>{row.staffName || "-"}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.startTime}</TableCell>
                        <TableCell>{row.endTime}</TableCell>
                        <TableCell className="text-right">{row.hours}</TableCell>
                        <TableCell className="text-right">
                          {row.baseSalary.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.overtimePay > 0 ? (
                            <span className="text-orange-600">
                              +{row.overtimePay.toLocaleString()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.allowance > 0 ? (
                            <span className="text-blue-600">
                              +{row.allowance.toLocaleString()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {row.totalSalary.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {row.error ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {row.error}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!row.error && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRow(row)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 確認匯入按鈕 */}
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreview(null)}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={loading || preview.summary.valid === 0 || imported}
                >
                  {imported ? "已匯入" : `確認匯入 ${preview.summary.valid} 筆`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 編輯對話框 */}
        <Dialog open={!!editingRow} onOpenChange={() => setEditingRow(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>調整薪資</DialogTitle>
            </DialogHeader>
            {editingRow && (
              <EditRowForm
                row={editingRow}
                onSave={handleUpdateRow}
                onCancel={() => setEditingRow(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* 說明 */}
        {!preview && (
          <Card>
            <CardHeader>
              <CardTitle>匯入說明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>請上傳 Excel (.xlsx, .xls) 或 CSV 檔案，檔案需包含以下欄位：</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>員工姓名</strong> - 必須與系統中的員工名稱完全相同</li>
                <li><strong>日期</strong> - 格式：YYYY-MM-DD 或 YYYY/MM/DD</li>
                <li><strong>集合時間</strong> - 格式：HH:mm（例如 09:00）</li>
                <li><strong>下班時間</strong> - 格式：HH:mm（例如 14:30）</li>
                <li><strong>補助</strong> - （選填）開車補助或其他雜費</li>
                <li><strong>備註</strong> - （選填）</li>
              </ul>
              <p className="text-sm">
                系統會自動根據員工主檔的基本薪資計算，超過 4 小時的部分按加班費計算。
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// 編輯表單組件
function EditRowForm({
  row,
  onSave,
  onCancel,
}: {
  row: PreviewRow;
  onSave: (row: PreviewRow) => void;
  onCancel: () => void;
}) {
  const [overtimePay, setOvertimePay] = useState(row.overtimePay);
  const [allowance, setAllowance] = useState(row.allowance);

  const handleSave = () => {
    const totalSalary = row.baseSalary + overtimePay + allowance;
    onSave({ ...row, overtimePay, allowance, totalSalary });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label>員工</Label>
          <p>{row.staffName}</p>
        </div>
        <div>
          <Label>日期</Label>
          <p>{row.date}</p>
        </div>
        <div>
          <Label>時間</Label>
          <p>{row.startTime} - {row.endTime}</p>
        </div>
        <div>
          <Label>時數</Label>
          <p>{row.hours} 小時</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>基本薪資</Label>
            <p className="text-lg font-semibold">NT$ {row.baseSalary.toLocaleString()}</p>
          </div>
          <div>
            <Label htmlFor="edit-overtime">加班費（可調整）</Label>
            <Input
              id="edit-overtime"
              type="number"
              value={overtimePay}
              onChange={(e) => setOvertimePay(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="edit-allowance">補助（可調整）</Label>
            <Input
              id="edit-allowance"
              type="number"
              value={allowance}
              onChange={(e) => setAllowance(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>總計</Label>
            <p className="text-lg font-semibold text-green-600">
              NT$ {(row.baseSalary + overtimePay + allowance).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={handleSave}>儲存</Button>
      </div>
    </div>
  );
}
