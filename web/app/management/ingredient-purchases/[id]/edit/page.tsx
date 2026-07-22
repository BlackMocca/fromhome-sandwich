'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { updateIngredientPurchase, getIngredientPurchases, getIngredients } from '@/lib/db';

export default function EditIngredientPurchasePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  // Parse the purchase ID
  const purchaseId = Number(params.id);

  // Fetch ingredients
  const { data: ingredients = [], isLoading: ingredientsLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: getIngredients,
  });

  const [purchaseDate, setPurchaseDate] = useState('');
  const [ingredientId, setIngredientId] = useState('');
  const [quantityStr, setQuantityStr] = useState('1');
  const [unit, setUnit] = useState('ชิ้น');
  const [amountStr, setAmountStr] = useState('0');
  const [note, setNote] = useState('');

  // Fetch the purchase record and related ingredient info
  useEffect(() => {
    async function fetchPurchase() {
      try {
        const result = await getIngredientPurchases({});
        if (Array.isArray(result)) {
          const p = result.find((item: any) => Number(item.id) === purchaseId);
          if (!p) return;

          setPurchaseDate(p.purchase_date || new Date().toISOString().split('T')[0]);
          
          // Extract ingredient_id and map to mock ingredients or just use the id as string
          const ingId = p.ingredient_id ? String(p.ingredient_id) : '';
          setIngredientId(ingId);

          // Handle quantity (could be number, decimal, etc.)
          let qtyVal: number;
          try {
            const parsedQty = Number(p.quantity);
            if (!isNaN(parsedQty) && parsedQty > 0) {
              qtyVal = Number.isInteger(parsedQty) ? parsedQty : parseFloat(parsedQty.toFixed(3));
            } else {
              qtyVal = 1;
            }
          } catch (e) {
            qtyVal = 1;
          }
          setQuantityStr(String(qtyVal));

          // Handle amount / total_cost
          let amtVal: number;
          try {
            const parsedAmt = Number(p.amount !== undefined ? p.amount : 0);
            if (isNaN(parsedAmt) || parsedAmt < 0) {
              amtVal = 0;
            } else {
              // Round to 2 decimal places, remove trailing zeros
              amtVal = Math.round((parsedAmt + Number.EPSILON) * 100) / 100;
              const strAmt = String(amtVal);
              if (strAmt.includes('.')) {
                const trimmed = strAmt.replace(/\.?0+$/, '');
                amtVal = parseFloat(trimmed === '' ? '0' : trimmed);
              }
            }
          } catch (e) {
            amtVal = 0;
          }
          setAmountStr(String(amtVal));

          // Note
          if (p.note !== null && p.note !== undefined) {
            setNote(p.note.toString());
          } else {
            setNote('');
          }
        }
      } catch (err: any) {
        console.error('[edit] fetch purchase error:', err);
      }
    }
    
    if (purchaseId > 0) {
      fetchPurchase();
    }
  }, [purchaseId]);

  // Validation state
  const ingredientSelected = !!ingredientId && Number(ingredientId) > 0;
  
  let quantityNum: number = 1;
  try {
    quantityNum = Number(quantityStr);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      quantityNum = 1; 
    }
  } catch (e) {
    quantityNum = 1;
  }

  const isQuantityValid = !isNaN(quantityNum) && quantityNum > 0;
  
  let parsedAmountForValidation: number | null = null;
  try { 
     if (!isNaN(Number(amountStr)) && Number(amountStr) >= 0) {
       parsedAmountForValidation = Number(amountStr); 
     } else {
       parsedAmountForValidation = -1; // mark invalid as negative or NaN
     }
  } catch (e) { 
     parsedAmountForValidation = null; 
  }

  const isAmountValid = !isNaN(Number(amountStr)) && Number(amountStr) >= 0;

  const canSubmit = ingredientSelected && isQuantityValid && isAmountValid;

  const updateMutation = useMutation({
    mutationFn: (payload: any) => {
      return updateIngredientPurchase(purchaseId, payload); 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-purchases'] });
      
      // Find ingredient name for toast message
      const selectedIngredient = ingredients.find(i => Number(i.id) === Number(ingredientId));
      const ingName = selectedIngredient ? selectedIngredient.name : `วัตถุดิบ ID ${ingredientId}`;
      const qtyNum = Number(quantityStr) || 1;
      const amtNum = Math.round((Number(amountStr) + Number.EPSILON)*100)/100;
      
      toast({ 
        title: 'สำเร็จ', 
        description: `อัปเดตการซื้อ "${ingName}" จำนวน ${qtyNum} ${unit !== '' ? unit : 'ชิ้น'} เรียบร้อย (ยอดรวม ฿${amtNum.toLocaleString()})` 
      });
      router.push('/management/ingredient-purchases');
    },
    onError: (err: any) => {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message || 'ไม่สามารถอัปเดตข้อมูลได้' });
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

    const finalQtyNum = Number(quantityStr);
    const finalAmtVal = Number(amountStr);

     if (isNaN(finalQtyNum) || finalQtyNum <= 0){
       toast({ title: 'ข้อมูลไม่ถูกต้อง', description: 'จำนวนต้องมากกว่า 0' });
       return;
    }
     
    if(isNaN(Number(amountStr)) || Number(amountStr)<0){
      toast({ title:'ข้อมูลไม่ถูกต้อง', description:'ยอดรวมต้องไม่น้อยกว่า 0'}); 
      return;
     }

   const payload: any = {
        ingredient_id: Number(ingredientId),
        purchase_date: purchaseDate,
        quantity: finalQtyNum,
        unit: (unit || '').trim() !== '' ? unit : 'ชิ้น',
        amount: Math.round((finalAmtVal + Number.EPSILON) * 100) / 100,
      }; 
      
    updateMutation.mutate(payload);
  };

  const ingredientNameForDisplay = ingredients.find(i => i.id === Number(ingredientId))?.name || `วัตถุดิบ ID ${ingredientId}`;
  let displayAmountNum: number = 0;
  try { displayAmountNum = Math.round((Number(amountStr) + Number.EPSILON)*100)/100;} catch(e){displayAmountNum=0;}

// Show loading state while fetching ingredients or purchase data
if (ingredientsLoading || !purchaseDate) {
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
            <h1 className="text-2xl font-bold text-primary">แก้ไขการซื้อวัตถุดิบ</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              อัปเดตข้อมูลการซื้อวัตถุดิบ {ingredientNameForDisplay} (ID: {ingredients.find(i => i.id === Number(ingredientId))?.name || ingredientId})
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
              value={quantityStr}
              onChange={(e) => setQuantityStr(e.target.value)}
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
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
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

      {/* Summary */}
<div className="mt-5 rounded-2xl bg-primary text-white px-5 py-4 flex items-center justify-between">
<span className="font-medium">ยอดรวมที่จ่าย</span>
<span className="text-xl font-bold">฿{displayAmountNum.toLocaleString()}</span>
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
          disabled={updateMutation.isPending || !canSubmit}
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          บันทึกการแก้ไข
        </Button>
      </div>
    </div>
  </div>
);
}

export const dynamic = 'force-dynamic';
