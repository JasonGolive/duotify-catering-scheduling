"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string | null;
  accountNumber: string | null;
  accountType: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BankAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const accountTypeLabels: Record<string, string> = {
    CHECKING: "支票帳戶",
    SAVINGS: "存款帳戶",
    CASH: "現金",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/v1/bank-accounts");
      if (!response.ok) throw new Error("無法載入銀行帳戶");
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      toast.error("載入銀行帳戶失敗");
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts
    .filter((a) => a.status === "ACTIVE")
    .reduce((sum, a) => sum + a.currentBalance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', letterSpacing: '-0.025em' }}>銀行帳戶管理</h1>
          <p style={{ color: '#6b7280' }}>管理所有銀行帳戶和現金</p>
        </div>
        <Button onClick={() => router.push("/bank-accounts/new")}>
          <Plus className="w-4 h-4 mr-2" />
          新增帳戶
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">總餘額（啟用帳戶）</p>
              <p className="text-3xl font-bold">
                NT$ {totalBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex gap-4 text-sm">
            <div>
              <span className="text-gray-500">帳戶數：</span>
              <span className="font-semibold ml-1">{accounts.length}</span>
            </div>
            <div>
              <span className="text-gray-500">啟用：</span>
              <span className="font-semibold ml-1 text-green-600">
                {accounts.filter((a) => a.status === "ACTIVE").length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">尚無銀行帳戶</p>
            <Button onClick={() => router.push("/bank-accounts/new")}>
              <Plus className="w-4 h-4 mr-2" />
              新增第一個帳戶
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const balanceChange = account.currentBalance - account.initialBalance;
            const isPositive = balanceChange >= 0;

            return (
              <Card
                key={account.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/bank-accounts/${account.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{account.accountName}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {account.bankName || accountTypeLabels[account.accountType]}
                      </p>
                    </div>
                    <Badge className={statusColors[account.status]}>
                      {account.status === "ACTIVE" ? "啟用" : "停用"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Balance */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">當前餘額</p>
                    <p className="text-2xl font-bold">
                      {account.currency} {account.currentBalance.toLocaleString()}
                    </p>
                  </div>

                  {/* Balance Change */}
                  <div className="flex items-center text-sm">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={isPositive ? "text-green-600" : "text-red-600"}>
                      {isPositive ? "+" : ""}
                      {balanceChange.toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-1">
                      （期初：{account.initialBalance.toLocaleString()}）
                    </span>
                  </div>

                  {/* Account Number */}
                  {account.accountNumber && (
                    <p className="text-xs text-gray-400 mt-3">
                      帳號：{account.accountNumber}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
