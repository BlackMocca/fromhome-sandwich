'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, DollarSign } from 'lucide-react';
import { getProductSalesLines } from '@/lib/db';
import { useState, useEffect } from 'react';

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

type ProductSummary = {
  product_id: number | null;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
};

export default function DashboardProductPage() {
  const [productLines, setProductLines] = useState<ProductSalesLine[]>([]);
  const [productSummaries, setProductSummaries] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lines = (await getProductSalesLines(today)) as ProductSalesLine[] || [];
        setProductLines(lines);

        // Group by product to create summary
        const summaries: Record<string, ProductSummary> = {};
        
        for (const line of lines) {
          if (!summaries[line.product_name]) {
            summaries[line.product_name] = {
              product_id: line.product_id,
              product_name: line.product_name,
              total_quantity: 0,
              total_revenue: 0,
              total_cost: 0,
              total_profit: 0,
            };
          }
          
          summaries[line.product_name].total_quantity += line.quantity;
          summaries[line.product_name].total_revenue += line.line_total;
          summaries[line.product_name].total_cost += line.line_cost;
          summaries[line.product_name].total_profit += line.line_profit;
        }

        setProductSummaries(Object.values(summaries).sort((a, b) => b.total_revenue - a.total_revenue));
      } catch (error) {
        console.error('Failed to fetch product data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const totalRevenue = productSummaries.reduce((sum, p) => sum + p.total_revenue, 0);
  const totalCost = productSummaries.reduce((sum, p) => sum + p.total_cost, 0);
  const totalProfit = productSummaries.reduce((sum, p) => sum + p.total_profit, 0);

  return (
    <div>
      {/* Header */}
      <h1 className="text-2xl font-bold text-primary mb-6">รายสินค้า</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="bg-action/10 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" /> รายได้รวมวันนี้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-action">฿{totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> ต้นทุนรวมวันนี้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">฿{totalCost.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className={`border-border/50 ${totalProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm flex items-center gap-2 ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              <DollarSign className="w-4 h-4" /> กำไรสุทธิวันนี้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              ฿{Math.abs(totalProfit).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product summary table */}
      <Card className="border-border/50 mb-6">
        <CardHeader>
          <CardTitle>สรุปยอดขายตามสินค้า (วันนี้)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">สินค้า</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">จำนวนขาย</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">รายได้</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">ต้นทุน</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">กำไร</th>
                </tr>
              </thead>
              <tbody>
                {productSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">ไม่มีข้อมูลการขายในวันนี้</td>
                  </tr>
                ) : (
                  productSummaries.map((product, index) => (
                    <tr key={`${product.product_id || product.product_name}-${index}`} className="border-b border-border/30 hover:bg-surface/50 transition-colors">
                      <td className="py-2 px-3 font-medium">{product.product_name}</td>
                      <td className="py-2 px-3 text-right">{product.total_quantity}</td>
                      <td className="py-2 px-3 text-right font-medium">฿{product.total_revenue.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">฿{product.total_cost.toLocaleString()}</td>
                      <td className={`py-2 px-3 text-right ${product.total_profit >= 0 ? 'text-success' : 'text-destructive'} font-medium`}>
                        ฿{Math.abs(product.total_profit).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed product sales lines */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>รายละเอียดการขายแต่ละรายการ (วันนี้)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">บิล</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">ช่องขาย</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">สินค้า</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">จำนวน</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">ราคา/ชิ้น</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">ยอดขาย</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">ต้นทุน/ชิ้น</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">กำไร/รายการ</th>
                </tr>
              </thead>
              <tbody>
                {productLines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-muted-foreground">ไม่มีข้อมูลการขายในวันนี้</td>
                  </tr>
                ) : (
                  productLines.map((line, index) => (
                    <tr key={`${line.receipt_id}-${index}`} className="border-b border-border/30 hover:bg-surface/50 transition-colors">
                      <td className="py-2 px-3 font-mono text-xs">{line.receipt_no}</td>
                      <td className="py-2 px-3"><span className="px-1.5 py-0.5 rounded bg-primary/10 text-xs font-mono text-primary">{line.channel_code}</span></td>
                      <td className="py-2 px-3 max-w-[200px] truncate" title={line.product_name}>{line.product_name}</td>
                      <td className="py-2 px-3 text-right">{line.quantity}</td>
                      <td className="py-2 px-3 text-right">฿{line.product_price.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-medium">฿{line.line_total.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">฿{line.product_cost.toLocaleString()}</td>
                      <td className={`py-2 px-3 text-right ${line.line_profit >= 0 ? 'text-success' : 'text-destructive'} font-medium`}>
                        ฿{Math.abs(line.line_profit).toLocaleString()}
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
