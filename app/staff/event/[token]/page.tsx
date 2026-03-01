"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Phone,
  User,
  Utensils,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Building,
  FileText,
} from "lucide-react";

interface EventDetail {
  name: string;
  date: string;
  dateRaw: string;
  assemblyTime: string | null;
  startTime: string | null;
  mealTime: string | null;
  location: string;
  address: string | null;
  mapsLink: string | null;
  venue: {
    name: string;
    equipment: string | null;
    notes: string | null;
  } | null;
  guestCount: {
    adults: number;
    children: number;
    vegetarian: number;
    total: number;
  };
  contactName: string | null;
  contactPhone: string | null;
  menu: string | null;
  reminders: string | null;
  notes: string | null;
  eventType: string;
  status: string;
  staff: Array<{
    name: string;
    role: string;
    attendanceStatus: string;
  }>;
}

const roleLabels: Record<string, string> = {
  FRONT: "外場",
  HOT: "熱台",
  BOTH: "皆可",
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "已排班",
  CONFIRMED: "已確認",
  ATTENDED: "已出勤",
};

export default function StaffEventDetailPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/staff/event/${token}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "無法載入活動資訊");
        }
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchEvent();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">無法顯示</h2>
            <p className="text-gray-600">{error || "找不到活動資訊"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>北歐餐桌到府私廚</span>
            <span>•</span>
            <span>活動資訊</span>
          </div>
          <h1 className="text-xl font-bold">{event.name}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 時間資訊 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              時間資訊
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">日期</span>
              <span className="font-medium">{event.date}</span>
            </div>
            {event.assemblyTime && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  集合時間
                </span>
                <span className="font-bold text-lg text-red-600">{event.assemblyTime}</span>
              </div>
            )}
            {event.mealTime && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">用餐時間</span>
                <span className="font-medium">{event.mealTime}</span>
              </div>
            )}
            {event.startTime && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">活動時間</span>
                <span className="font-medium">{event.startTime}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 場地資訊 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              場地資訊
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="font-medium text-lg">{event.location}</div>
              {event.address && (
                <div className="text-gray-600 mt-1">{event.address}</div>
              )}
            </div>
            {event.mapsLink && (
              <Button variant="outline" size="sm" asChild>
                <a href={event.mapsLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  在 Google Maps 中開啟
                </a>
              </Button>
            )}
            {event.venue?.equipment && (
              <div className="pt-2">
                <div className="text-sm text-gray-500 mb-1">場地設備</div>
                <div className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                  {event.venue.equipment}
                </div>
              </div>
            )}
            {event.venue?.notes && (
              <div>
                <div className="text-sm text-gray-500 mb-1">場地注意事項</div>
                <div className="text-sm bg-yellow-50 p-3 rounded whitespace-pre-wrap border border-yellow-200">
                  {event.venue.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 人數 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              人數
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{event.guestCount.total}</div>
                <div className="text-xs text-gray-500">總人數</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{event.guestCount.adults}</div>
                <div className="text-xs text-gray-500">大人</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-600">{event.guestCount.children}</div>
                <div className="text-xs text-gray-500">小孩</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{event.guestCount.vegetarian}</div>
                <div className="text-xs text-gray-500">素食</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 菜單 */}
        {event.menu && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-600" />
                菜單
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">{event.menu}</div>
            </CardContent>
          </Card>
        )}

        {/* 提醒事項 */}
        {event.reminders && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                提醒事項
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">{event.reminders}</div>
            </CardContent>
          </Card>
        )}

        {/* 聯絡資訊 */}
        {(event.contactName || event.contactPhone) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-5 h-5 text-cyan-600" />
                聯絡資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {event.contactName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{event.contactName}</span>
                </div>
              )}
              {event.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${event.contactPhone}`} className="text-blue-600 underline">
                    {event.contactPhone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 備註 */}
        {event.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                備註
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm text-gray-600">{event.notes}</div>
            </CardContent>
          </Card>
        )}

        {/* 當天工作人員 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              當天工作人員
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {event.staff.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant="outline">{roleLabels[s.role] || s.role}</Badge>
                  </div>
                  {s.attendanceStatus === "CONFIRMED" && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      已確認
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 py-4">
          北歐餐桌到府私廚 排班系統
        </div>
      </div>
    </div>
  );
}
