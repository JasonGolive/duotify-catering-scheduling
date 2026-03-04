"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, File as FileIcon, X, Image, FileText } from "lucide-react";

interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
  uploadedAt: string;
}

interface AttachmentUploadProps {
  paymentId: string;
  attachments: Attachment[];
  onAttachmentAdded: () => void;
  onAttachmentDeleted: () => void;
}

export function AttachmentUpload({
  paymentId,
  attachments,
  onAttachmentAdded,
  onAttachmentDeleted,
}: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 驗證檔案大小（10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error("檔案過大，最大 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("請選擇檔案");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (description) {
        formData.append("description", description);
      }

      const res = await fetch(`/api/v1/payments-out/${paymentId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "上傳失敗");
      }

      toast.success("附件已上傳");
      setSelectedFile(null);
      setDescription("");
      onAttachmentAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("確定要刪除此附件嗎？")) return;

    try {
      const res = await fetch(
        `/api/v1/payments-out/${paymentId}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("刪除失敗");

      toast.success("附件已刪除");
      onAttachmentDeleted();
    } catch (error) {
      toast.error("刪除失敗");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  return (
    <div className="space-y-4">
      {/* 上傳區塊 */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label htmlFor="file">選擇檔案</Label>
            <p className="text-xs text-gray-500 mb-2">
              支援：圖片、PDF、Word、Excel（最大 10MB）
            </p>
            <Input
              id="file"
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>

          {selectedFile && (
            <>
              <div>
                <Label htmlFor="description">檔案說明（選填）</Label>
                <Textarea
                  id="description"
                  placeholder="例如：供應商送貨單、發票"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  disabled={uploading}
                />
              </div>

              <div className="flex items-center gap-2">
                <FileIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm flex-1">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "上傳中..." : "上傳"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setDescription("");
                  }}
                  disabled={uploading}
                >
                  取消
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 附件列表 */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">已上傳附件 ({attachments.length})</h3>
          {attachments.map((attachment) => (
            <Card key={attachment.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="text-gray-400">
                  {getFileIcon(attachment.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={attachment.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline block truncate"
                  >
                    {attachment.originalName}
                  </a>
                  {attachment.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {attachment.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">
                      {formatFileSize(attachment.fileSize)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(attachment.uploadedAt).toLocaleString("zh-TW")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(attachment.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
