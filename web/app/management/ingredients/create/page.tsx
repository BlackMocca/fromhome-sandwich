'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { createIngredient } from '@/lib/db';

export default function CreateIngredientPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('ชิ้น');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast({ title: 'ข้อมูลไม่ถูกต้อง', description: 'กรุณากรอกชื่อวัตถุดิบ' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createIngredient({
        name: name.trim(),
        default_unit: defaultUnit.trim() || null,
        description: description.trim() || null,
      });

      toast({ title: 'สำเร็จ', description: 'เพิ่มวัตถุดิบเรียบร้อยแล้ว' });
      router.push('/management/ingredients');
    } catch (err) {
      console.error('[createIngredient] Error:', err);
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถเพิ่มวัตถุดิบได้' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-primary">เพิ่มวัตถุดิบใหม่</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              เพิ่มข้อมูลวัตถุดิบเพื่อใช้ในการบันทึกการซื้อและคำนวณต้นทุน
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-primary">
            ชื่อวัตถุดิบ <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            type="text"
            placeholder="เช่น ข้าวสาร, น้ำมันพืช, ไก่สด..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Default Unit */}
        <div className="space-y-2">
          <label htmlFor="defaultUnit" className="text-sm font-medium text-primary">
            หน่วยนับเริ่มต้น <span className="text-muted-foreground text-xs">(ไม่บังคับ)</span>
          </label>
          <Input
            id="defaultUnit"
            type="text"
            placeholder="เช่น กก., ลู่น, กล่อง, ซอง..."
            value={defaultUnit}
            onChange={(e) => setDefaultUnit(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-primary">
            หมายเหตุ <span className="text-muted-foreground text-xs">(ไม่บังคับ)</span>
          </label>
          <textarea
            id="description"
            placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-surface placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action resize-none"
          />
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
            disabled={isSubmitting || !canSubmit}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-1" />
            )}
            บันทึกวัตถุดิบ
          </Button>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
