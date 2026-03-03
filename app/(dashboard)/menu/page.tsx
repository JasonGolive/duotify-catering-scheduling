"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, FileText, ShoppingCart, Plus } from "lucide-react";

export default function MenuPage() {
  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827" }}>
          菜單管理
        </h1>
        <p style={{ color: "#6b7280", marginTop: "4px" }}>
          管理菜單範本、品項與備料
        </p>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "24px" 
      }}>
        {/* 品項主檔 */}
        <Link href="/menu/items" style={{ textDecoration: "none" }}>
          <Card style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  backgroundColor: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <UtensilsCrossed style={{ width: "24px", height: "24px", color: "#2563eb" }} />
                </div>
                <CardTitle style={{ fontSize: "18px" }}>品項主檔</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                管理所有料理品項及其 BOM（材料組成）
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* 菜單範本 */}
        <Link href="/menu/templates" style={{ textDecoration: "none" }}>
          <Card style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  backgroundColor: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <FileText style={{ width: "24px", height: "24px", color: "#16a34a" }} />
                </div>
                <CardTitle style={{ fontSize: "18px" }}>菜單範本</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                建立標準菜單範本（BBQ、餐酒、義法等）
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* 備料彙總 */}
        <Link href="/menu/procurement" style={{ textDecoration: "none" }}>
          <Card style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  backgroundColor: "#fef3c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <ShoppingCart style={{ width: "24px", height: "24px", color: "#d97706" }} />
                </div>
                <CardTitle style={{ fontSize: "18px" }}>備料彙總</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                跨場次材料需求彙總與採購單匯出
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
