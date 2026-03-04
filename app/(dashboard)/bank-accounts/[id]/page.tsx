"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
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

interface Transaction {
  id: string;
  transactionNumber: string;
  date: string;
  type: "IN" | "OUT";
  amount: number;
  method: string;
  category: string;
  description: string;
  status: string;
}

export default function BankAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  const accountTypeLabels: Record<string, string> = {
    CHECKING: "支票帳戶",
    SAVINGS: "存款帳戶",
    CASH: "現金",
  };

  useEffect(() => {
    fetchAccount();
    fetchTransactions();
  }, [id]);

  const fetchAccount = async () => {
    try {
      const response = await fetch(`/api/v1/bank-accounts/${id}`);
      if (!response.ok) throw new Error("無法載入帳戶");
      const data = await response.json();
      setAccount(data);
    } catch (error) {
      toast.error("載入帳戶失敗");
      router.push("/bank-accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/v1/bank-accounts/${id}/transactions`);
      if (!response.ok) throw new Error("無法載入交易記錄");
      const data = await response.json();
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch (error) {
      toast.error("載入交易記錄失敗");
    }
  };

  if (loading || !account) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  const balanceChange = account.currentBalance - account.initialBalance;
  const isPositive = balanceChange >= 0;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/bank-accounts")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{account.accountName}</h1>
            <p className="text-gray-500 text-sm">
              {account.bankName || accountTypeLabels[account.accountType]}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/bank-accounts/${id}/edit`)}>
          <Edit className="w-4 h-4 mr-2" />
          編輯
        </Button>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              當前餘額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {account.currency} {account.currentBalance.toLocaleString()}
            </p>
            <div className="flex items-center mt-2 text-sm">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={isPositive ? "text-green-600" : "text-red-600"}>
                {isPositive ? "+" : ""}
                {balanceChange.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              總收入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              +{summary.totalIn.toLocaleString()}
            </p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <ArrowDownCircle className="w-4 h-4 mr-1" />
              收款記錄
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              總支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              -{summary.totalOut.toLocaleString()}
            </p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <ArrowUpCircle className="w-4 h-4 mr-1" />
              付款記錄
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>交易明細 ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              尚無交易記錄
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={tx.type === "IN" ? "default" : "secondary"}
                          className={
                            tx.type === "IN"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {tx.type === "IN" ? "收款" : "付款"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {tx.transactionNumber}
                        </span>
                      </div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(tx.date).toLocaleDateString("zh-TW")} • {tx.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          tx.type === "IN" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.type === "IN" ? "+" : "-"}
                        {tx.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>帳戶資訊</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">帳戶類型</dt>
              <dd className="mt-1">{accountTypeLabels[account.accountType]}</dd>
            </div>
            {account.accountNumber && (
              <div>
                <dt className="text-sm font-medium text-gray-500">帳號</dt>
                <dd className="mt-1">{account.accountNumber}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">幣別</dt>
              <dd className="mt-1">{account.currency}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">期初餘額</dt>
              <dd className="mt-1">
                {account.currency} {account.initialBalance.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">狀態</dt>
              <dd className="mt-1">
                <Badge
                  className={
                    account.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {account.status === "ACTIVE" ? "啟用" : "停用"}
                </Badge>
              </dd>
            </div>
            {account.notes && (
              <div>
                <dt className="text-sm font-medium text-gray-500">備註</dt>
                <dd className="mt-1 text-gray-700">{account.notes}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">建立時間</dt>
              <dd className="mt-1">
                {new Date(account.createdAt).toLocaleString("zh-TW")}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
