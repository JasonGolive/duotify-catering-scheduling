"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Edit, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";

interface PreviewRow {
  row: number;
  staffName: string;
  staffId?: string;
  date: string;
  eventId?: string;
  eventName?: string;
  assemblyTime: string;
  clockIn: string;
  clockOut: string;
  hours: number;
  baseSalary: number;
  overtimeMinutes: number;
  overtimePay: number;
  allowance: number;
  totalSalary: number;
  error?: string;
  warning?: string;
  notes?: string;
}

interface PreviewResult {
  preview: boolean;
  results: PreviewRow[];
  summary: {
    total: number;
    valid: number;
    errors: number;
    warnings: number;
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
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsSmallScreen(window.innerWidth < 640);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
              clockIn: r.clockIn,
              clockOut: r.clockOut,
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
        上班時間: "09:00",
        下班時間: "14:00",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "打卡記錄");
    XLSX.writeFile(wb, "打卡記錄範本.xlsx");
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
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* 標題與操作 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isSmallScreen ? 'column' : 'row', 
          justifyContent: 'space-between', 
          alignItems: isSmallScreen ? 'flex-start' : 'center', 
          gap: '1rem' 
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>薪資管理</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              下載範本
            </Button>
            <Button asChild>
              <label style={{ cursor: 'pointer' }}>
                <Upload className="h-4 w-4 mr-2" />
                匯入檔案
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
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
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isSmallScreen ? '1fr' : 'repeat(3, 1fr)', 
              gap: '1rem' 
            }}>
              <div>
                <Label>基本時數</Label>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>4 小時（固定）</p>
              </div>
              <div>
                <Label>加班計算單位</Label>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>每 10 分鐘</p>
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
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
              薪資計算：基本薪資（≤4小時）+ 加班費（超過4小時每10分鐘）+ 補助
            </p>
          </CardContent>
        </Card>

        {/* 預覽結果 */}
        {preview && (
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <CardTitle>預覽結果</CardTitle>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                  <span>
                    總筆數: <strong>{preview.summary.total}</strong>
                  </span>
                  <span style={{ color: '#16a34a' }}>
                    有效: <strong>{preview.summary.valid}</strong>
                  </span>
                  {preview.summary.warnings > 0 && (
                    <span style={{ color: '#ca8a04' }}>
                      警告: <strong>{preview.summary.warnings}</strong>
                    </span>
                  )}
                  {preview.summary.errors > 0 && (
                    <span style={{ color: '#dc2626' }}>
                      錯誤: <strong>{preview.summary.errors}</strong>
                    </span>
                  )}
                  <span style={{ color: '#2563eb' }}>
                    總薪資: <strong>NT$ {preview.summary.totalSalary.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: '3rem' }}>#</TableHead>
                      <TableHead>員工</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>活動</TableHead>
                      <TableHead>集合時間</TableHead>
                      <TableHead>下班打卡</TableHead>
                      <TableHead style={{ textAlign: 'right' }}>時數</TableHead>
                      <TableHead style={{ textAlign: 'right' }}>基本</TableHead>
                      <TableHead style={{ textAlign: 'right' }}>加班</TableHead>
                      <TableHead style={{ textAlign: 'right' }}>補助</TableHead>
                      <TableHead style={{ textAlign: 'right' }}>總計</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead style={{ width: '3rem' }}></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.results.map((row) => (
                      <TableRow
                        key={row.row}
                        style={{ backgroundColor: row.error ? '#fef2f2' : row.warning ? '#fefce8' : undefined }}
                      >
                        <TableCell>{row.row}</TableCell>
                        <TableCell>{row.staffName || "-"}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.eventName}>
                          {row.eventName || <span style={{ color: '#6b7280' }}>-</span>}
                        </TableCell>
                        <TableCell>{row.assemblyTime}</TableCell>
                        <TableCell>{row.clockOut}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{row.hours}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          {row.baseSalary.toLocaleString()}
                        </TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          {row.overtimePay > 0 ? (
                            <span style={{ color: '#ea580c' }}>
                              +{row.overtimePay.toLocaleString()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          {row.allowance > 0 ? (
                            <span style={{ color: '#2563eb' }}>
                              +{row.allowance.toLocaleString()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell style={{ textAlign: 'right', fontWeight: 600 }}>
                          {row.totalSalary.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {row.error ? (
                            <Badge variant="destructive" className="flex items-center gap-1 whitespace-nowrap">
                              <AlertCircle className="h-3 w-3" />
                              {row.error}
                            </Badge>
                          ) : row.warning ? (
                            <Badge variant="outline" className="text-yellow-600 flex items-center gap-1 whitespace-nowrap">
                              <AlertTriangle className="h-3 w-3" />
                              {row.warning}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.5rem' }}>
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
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>請上傳員工打卡記錄的 Excel (.xlsx, .xls) 或 CSV 檔案：</p>
              <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                <li><strong>員工姓名</strong> - 必須與系統中的員工名稱完全相同</li>
                <li><strong>日期</strong> - 格式：YYYY-MM-DD 或 YYYY/MM/DD</li>
                <li><strong>上班時間</strong> - 打卡上班時間（格式：HH:mm）</li>
                <li><strong>下班時間</strong> - 打卡下班時間（格式：HH:mm）</li>
              </ul>
              <div style={{ backgroundColor: '#f4f4f5', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>薪資計算方式：</p>
                <ol style={{ listStyleType: 'decimal', listStylePosition: 'inside', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#6b7280' }}>
                  <li>系統會根據員工+日期自動比對活動排班</li>
                  <li>從活動的<strong>集合時間</strong>到打卡<strong>下班時間</strong>計算工時</li>
                  <li>≤4 小時發基本薪資，超過每 10 分鐘加班費</li>
                  <li>匯入後可在預覽畫面調整加班費和補助</li>
                </ol>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <strong>提示：</strong>請確保活動已設定集合時間，且員工已排班到該活動
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href="/salary/report">
                  <Button variant="outline">查看薪資報表</Button>
                </Link>
              </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
        <div>
          <Label>員工</Label>
          <p>{row.staffName}</p>
        </div>
        <div>
          <Label>日期</Label>
          <p>{row.date}</p>
        </div>
        <div>
          <Label>活動</Label>
          <p>{row.eventName || "-"}</p>
        </div>
        <div>
          <Label>時間</Label>
          <p>{row.assemblyTime} - {row.clockOut}</p>
        </div>
        <div>
          <Label>時數</Label>
          <p>{row.hours} 小時</p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <Label>基本薪資</Label>
            <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>NT$ {row.baseSalary.toLocaleString()}</p>
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
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#16a34a' }}>
              NT$ {(row.baseSalary + overtimePay + allowance).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '1rem' }}>
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={handleSave}>儲存</Button>
      </div>
    </div>
  );
}
