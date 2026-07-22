'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { createIngredientPurchase, getIngredients } from '@/lib/db';

export default function CreateIngredientPurchasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch ingredients
  const { data: ingredients = [], isLoading: ingredientsLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: getIngredients,
  });

  const [ingredientId, setIngredientId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('ชิ้น');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // Validation state
  const ingredientSelected = !!ingredientId && Number(ingredientId) > 0;
  const quantityNum = Number(quantity);
  const amountNum = Number(amount) || 0;
  
  const isQuantityValid = !isNaN(quantityNum) && quantityNum > 0;
  const isAmountValid = !isNaN(Number(amount)) && Number(amount) >= 0;

  const canSubmit = ingredientSelected && isQuantityValid && isAmountValid;

  const createMutation = useMutation({
    mutationFn: () =>
      createIngredientPurchase({
        ingredient_id: Number(ingredientId),
        purchase_date: purchaseDate,
        quantity: quantityNum,
        unit: unit || 'ชิ้น',
        amount: amountNum,
        note: note.trim() || null,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-purchases'] });
      
      // Find ingredient name for toast message
      const selectedIngredient = ingredients.find(i => Number(i.id) === Number(ingredientId));
      const ingName = selectedIngredient ? selectedIngredient.name : `ID ${ingredientId}`;
      
      toast({ 
        title: 'สำเร็จ', 
        description: `บันทึกการซื้อ "${ingName}" จำนวน ${quantityNum} ${unit || 'ชิ้น'} เรียบร้อย (ยอดรวม ฿${amountNum.toLocaleString()})` 
      });
      router.push('/management/ingredient-purchases');
    },
    onError: (err) => {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message || 'ไม่สามารถบันทึกข้อมูลได้' });
    },
  });

  const handleSubmit = () => {
    if (!canSubmit) {
      let errorMsg = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      if (!ingredientSelected) errorMsg = 'กรุณาเลือกวัตถุดิบ';
      else if (!isQuantityValid) errorMsg = 'จำนวนต้องมากกว่า 0';
      else if (!isAmountValid) errorMsg = 'ยอดรวมต้องไม่น้อยกว่า 0';
      
      toast({ title: 'ข้อมูลไม่ถูกต้อง', description: errorMsg });
      return;
    }
    createMutation.mutate();
  };

  // Get selected ingredient name for display
  const selectedIngredientName = ingredients.find(i => Number(i.id) === Number(ingredientId))?.name || '';

  if (ingredientsLoading) {
    return (
      <div className="w-full max-w-[720px] mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[720px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary">บันทึกการซื้อวัตถุดิบใหม่</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              บันทึกค่าใช้จ่ายในการซื้อวัตถุดิบเพื่อเปรียบเทียบกับรายได้จากการขาย
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        {/* Purchase Date */}
        <div className="space-y-2">
          <label htmlFor="purchaseDate" className="text-sm font-medium text-primary">
            วันที่ซื้อ <span className="text-destructive">*</span>
          </label>
          <Input
            id="purchaseDate"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
        </div>

        {/* Ingredient Select */}
        <div className="space-y-2">
          <label htmlFor="ingredientId" className="text-sm font-medium text-primary">
            วัตถุดิบ <span className="text-destructive">*</span>
          </label>
          <select
            id="ingredientId"
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
            required
            disabled={!ingredients || ingredients.length === 0}
            className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-surface placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">เลือกวัตถุดิบ...</option>
            {ingredients.length === 0 ? (
              <option value="" disabled>ไม่มีข้อมูลวัตถุดิบน</option>
            ) : (
              ingredients.map((ing: any) => (
                <option key={ing.id} value={String(ing.id)}>{ing.name}</option>
              ))
            )}
          </select>
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium text-primary">
              จำนวนที่ซื้อ <span className="text-destructive">*</span>
            </label>
            <Input
              id="quantity"
              type="number"
              min={0.001}
              step={0.001}
              placeholder="เช่น 1, 5.5, 100..."
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="unit" className="text-sm font-medium text-primary">
              หน่วยนับ <span className="text-muted-foreground text-xs">(ไม่บังคับ)</span>
            </label>
            <Input
              id="unit"
              placeholder="เช่น กล่อง, กก., ลู่น..."
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium text-primary">
            ยอดรวมที่จ่าย (บาท) <span className="text-destructive">*</span>
          </label>
          <Input
            id="amount"
            type="number"
            min={0}
            step={0.01}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Note */}
        <div className="space-y-2">
          <label htmlFor="note" className="text-sm font-medium text-primary">
            หมายเหตุ <span className="text-muted-foreground text-xs">(ไม่บังคับ)</span>
          </label>
          <textarea
            id="note"
            placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-surface placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action resize-none"
          />
        </div>
      </div>

      {/* Summary - Ingredient */}
      <div className="mt-5 rounded-2xl bg-primary text-white px-5 py-4 flex items-center justify-between">
        <span className="font-medium">วัตถุดิบที่เลือก</span>
        <span className="text-lg font-bold truncate max-w-[60%]">{selectedIngredientName || 'ยังไม่ได้เลือก'}</span>
      </div>

      {/* Summary - Amount */}
<div className="mt-5 rounded-2xl bg-primary text-white px-5 py-4 flex items-center justify-between">
<span className="font-medium">ยอดรวมที่จ่าย</span>
<span className="text-xl font-bold">฿{Number(amount || 0).toLocaleString()}</span>
</div>

      {/* Actions */}
<div className="flex justify-end gap-2 mt-5 pb-8">
        <Button variant="destructive" onClick={() => router.back()}>
          ยกเลิก
        </Button>
        <Button
          variant="primary"
          className="text-white"
          onClick={handleSubmit}
          disabled={createMutation.isPending || !canSubmit}
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-1" />
          )}
          บันทึกการซื้อ
        </Button>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
