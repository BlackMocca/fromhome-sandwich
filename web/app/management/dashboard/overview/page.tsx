'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Package, ReceiptText, TrendingUp, DollarSign } from 'lucide-react';
import { getDailySummary, getProductSalesLines } from '@/lib/db';
import { useState, useEffect } from 'react';

type DailySummaryRow = {
  bill_date: string;
  channel_code: string;
  order_count: number;
  total_items: number;
  total_sales: number;
  total_discounts: number;
  net_sales: number;
  total_cost: number;
  net_profit: number;
};

type ProductSalesLine = {
  receipt_id: number;
  receipt_no: string;
  bill_date: string;
  channel_code: string;
  product_id: number | null;
  product_name: string;
  product_price: number;
  product_cost: number;
  quantity: number;
  line_total: number;
  line_cost: number;
  line_profit: number;
};

export default function DashboardOverviewPage() {
  const [dailySummaries, setDailySummaries] = useState<DailySummaryRow[]>([]);
  const [productLines, setProductLines] = useState<ProductSalesLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [summaries, lines] = await Promise.all([
          getDailySummary(today),
          getProductSalesLines(today),
        ]);
        setDailySummaries((summaries as DailySummaryRow[]) || []);
        setProductLines((lines as ProductSalesLine[]) || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const todaySummary = dailySummaries.reduce(
    (acc, row) => ({
      order_count: acc.order_count + row.order_count,
      total_items: acc.total_items + row.total_items,
      total_sales: acc.total_sales + row.total_sales,
      total_discounts: acc.total_discounts + row.total_discounts,
      net_sales: acc.net_sales + row.net_sales,
      total_cost: acc.total_cost + row.total_cost,
      net_profit: acc.net_profit + row.net_profit,
    }),
    { order_count: 0, total_items: 0, total_sales: 0, total_discounts: 0, net_sales: 0, total_cost: 0, net_profit: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <h1 className="text-2xl font-bold text-primary mb-6">ภาพรวมระบบจัดการ</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/10 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">จำนวนบิลวันนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{todaySummary.order_count}</p>
          </CardContent>
        </Card>

        <Card className="bg-action/10 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">รายการสินค้าทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-action">{todaySummary.total_items}</p>
          </CardContent>
        </Card>

        <Card className="bg-success/10 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">ยอดขายรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">฿{todaySummary.net_sales.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">กำไรสุทธิ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">฿{todaySummary.net_profit.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel breakdown */}
      <Card className="border-border/50 mb-6">
        <CardHeader>
          <CardTitle>สรุปตามช่องทางการขาย (วันนี้)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dailySummaries.length === 0 ? (
              <p className="text-muted-foreground text-sm">ไม่มีข้อมูลบิลในวันนี้</p>
            ) : (
              dailySummaries.map((row, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded bg-primary/10 text-xs font-mono text-primary">{row.channel_code}</span>
                    <span className="text-sm text-muted-foreground">{row.order_count} บิล | {row.total_items} รายการ</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-success font-medium">ยอดขาย: ฿{row.net_sales.toLocaleString()}</span>
                    <span className="text-destructive font-medium">กำไร: ฿{row.net_profit.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent product sales lines */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>รายละเอียดการขายสินค้า (วันนี้)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">บิล</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">ช่องขาย</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">สินค้า</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">จำนวน</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">ยอดขาย</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">ต้นทุน</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">กำไร</th>
                </tr>
              </thead>
              <tbody>
                {productLines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-muted-foreground">ไม่มีข้อมูลการขายในวันนี้</td>
                  </tr>
                ) : (
                  productLines.map((line, index) => (
                    <tr key={`${line.receipt_id}-${index}`} className="border-b border-border/30 hover:bg-surface/50 transition-colors">
                      <td className="py-2 px-3 font-mono text-xs">{line.receipt_no}</td>
                      <td className="py-2 px-3"><span className="px-1.5 py-0.5 rounded bg-primary/10 text-xs font-mono text-primary">{line.channel_code}</span></td>
                      <td className="py-2 px-3 max-w-[200px] truncate">{line.product_name}</td>
                      <td className="py-2 px-3 text-right">{line.quantity}</td>
                      <td className="py-2 px-3 text-right font-medium">฿{line.line_total.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">฿{line.line_cost.toLocaleString()}</td>
                      <td className={`py-2 px-3 text-right ${line.line_profit >= 0 ? 'text-success' : 'text-destructive'} font-medium`}>
                        ฿{line.line_profit.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const dynamic = 'force-dynamic';
