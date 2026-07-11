'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { SaveIcon, AlertCircle, CheckCircle2, Eye, X } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ui/image-upload';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';
import type { ProductAddon } from '@/types/product_addon';
import { getActiveCategories, getProductById, updateProduct, saveProductAddonMappings, getActiveProductAddons, getProductAddonMappings } from '@/lib/db';
import { toast } from '@/lib/toast';
import { ProductCard } from '@/components/app/product-card';

/* ─── Validation Schema (Yup) ─── */
const editProductSchema = yup.object().shape({
  name: yup.string().trim().required('กรุณากรอกชื่อสินค้า').min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  category_id: yup.number().required('กรุณาเลือกหมวดหมู่').positive('หมวดหมู่ต้องเป็นตัวเลขบวก').integer('หมวดหมู่ต้องเป็นจำนวนเต็ม'),
  cover_url: yup.string().nullable(),
  base_price: yup
    .number()
    .typeError('กรุณากรอกราคาขาย')
    .required('กรุณากรอกราคاขาย')
    .min(0, 'ราคาต้องไม่ติดลบ'),
  cost: yup
    .number()
    .typeError('กรุณากรอกต้นทุน')
    .required('กรุณากรอกต้นทุน')
    .min(0, 'ต้นทุนต้องไม่ติดลบ'),
});

type FormValues = {
  name: string;
  category_id: number;
  cover_url?: string;
  base_price: number;
  cost: number;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productAddons, setProductAddons] = useState<ProductAddon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    getActiveCategories().then(setCategories).catch(console.error);
    getActiveProductAddons().then(setProductAddons).catch(console.error);
    
    if (params?.id) {
      getProductById(params.id).then((p: Product | null) => {
        setProduct(p);
        if (p && p.id) {
          // Fetch mapped addons for this product
          getProductAddonMappings(p.id).then(mappings => {
            setSelectedAddonIds(mappings.map(m => m.addon_id));
          }).catch(console.error);
        }
      }).catch(console.error);
    }
  }, [params?.id]);

  /* ─── Submit handler (calls PostgREST directly) ─── */
  const handleSubmit = async (values: FormValues) => {
    if (!product) return;
    
    setBanner(null);
    setIsSubmitting(true);
    try {
      await updateProduct(product.id, {
        name: values.name.trim(),
        category_id: values.category_id,
        cover_url: values.cover_url?.trim() || null,
        base_price: values.base_price,
        cost: values.cost,
        is_active: true,
      });

      // Save/update product-addon mappings
      await saveProductAddonMappings(product.id, selectedAddonIds);

      toast({
        title: 'สำเร็จ!',
        description: 'แก้ไขสินค้าเรียบร้อยแล้ว',
      });
      setBanner({ kind: 'success', text: 'แก้ไขสินค้าเรียบร้อยแล้ว' });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      setTimeout(() => router.push('/management/products'), 1500);
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'ไม่สามารถแก้ไขสินค้าได้',
      });
      setBanner({
        kind: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถแก้ไขสินค้าได้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Formik ─── */
  const formik = useFormik<FormValues>({
    initialValues: {
      name: product?.name || '',
      category_id: product?.category_id || (categories.length > 0 ? categories[0].id : 0),
      cover_url: product?.cover_url || '',
      base_price: product?.base_price || 0,
      cost: product?.cost || 0,
    },
    enableReinitialize: true,
    validationSchema: editProductSchema,
    onSubmit: handleSubmit,
  });

  const toggleAddon = (addonId: number) => {
    setSelectedAddonIds(prev => 
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  // Build preview product data from formik values and selected addons
  const previewProduct: any = {
    id: product?.id || 0,
    name: formik.values.name || (product?.name || 'ชื่อสินค้าตัวอย่าง'),
    category_id: formik.values.category_id || (product?.category_id || 0),
    cover_url: formik.values.cover_url || (product?.cover_url || null),
    base_price: formik.values.base_price || (product?.base_price || 0),
    cost: formik.values.cost || (product?.cost || 0),
    is_active: true,
  };

  const previewCategory = categories.find(c => c.id === formik.values.category_id) || 
                           (product ? categories.find(c => c.id === product.category_id) || null : null);

  const previewOptions: ProductAddon[] = selectedAddonIds.map(addonId => 
    productAddons.find(a => a.id === addonId)
  ).filter(Boolean as any);

  if (!product && !categories.length && !productAddons.length) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center text-muted-foreground">
        กำลังโหลดข้อมูลสินค้า...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border border-primary/20 bg-white shadow-sm">
        <CardHeader className="space-y-1.5 pb-2">
          <CardTitle className="text-xl font-bold text-primary text-center">
            แก้ไขสินค้า: {product?.name}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            อัพเดตข้อมูลสินค้า (Product) สำหรับจัดการเมนูและราคา
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {/* Banners */}
          {banner?.kind === 'success' && (
            <div role="status" className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="flex-1">
                <span>{banner.text}</span>
                <button type="button" onClick={() => router.push('/management/products')} className="ml-2 font-semibold underline underline-offset-2 hover:text-success/80">
                  กลับไปหน้าสินค้าทั้งหมด
                </button>
              </div>
            </div>
          )}

          {banner?.kind === 'error' && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{banner.text}</span>
            </div>
          )}

          {/* Form Container */}
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Image Upload - positioned above product name */}
            <div className="flex flex-col items-center justify-center mb-6">
              <ImageUpload
                value={formik.values.cover_url || ''}
                onChange={(url) => formik.setFieldValue('cover_url', url)}
                label="รูปภาพสินค้า"
                variant="cover"
                path='products'
              />
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-primary">
                ชื่อสินค้า <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="off"
                placeholder="เช่น แซนด์วิชมะม่วง, ชาเย็น"
                value={formik.values.name}
                onChange={formik.handleChange('name')}
                onBlur={formik.handleBlur('name')}
                error={(formik.touched.name ? (formik.errors.name as string) : undefined)}
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor="category_id" className="block text-sm font-medium text-primary">
                หมวดหมู่ <span className="text-destructive">*</span>
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formik.values.category_id}
                onChange={(e) => formik.setFieldValue('category_id', Number(e.target.value))}
                onBlur={formik.handleBlur('category_id')}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {formik.touched.category_id && formik.errors.category_id && (
                <p className="text-sm text-destructive">{formik.errors.category_id as string}</p>
              )}
            </div>

            {/* Base Price & Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="base_price" className="block text-sm font-medium text-primary">
                  ราคาขาย (บาท) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="base_price"
                  name="base_price"
                  type="number"
                  min="0"
                  step="1"
                  autoComplete="off"
                  placeholder="เช่น 45"
                  value={formik.values.base_price}
                  onChange={formik.handleChange('base_price')}
                  onBlur={formik.handleBlur('base_price')}
                  error={(formik.touched.base_price ? (formik.errors.base_price as string) : undefined)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cost" className="block text-sm font-medium text-primary">
                  ต้นทุน (บาท) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="1"
                  autoComplete="off"
                  placeholder="เช่น 28"
                  value={formik.values.cost}
                  onChange={formik.handleChange('cost')}
                  onBlur={formik.handleBlur('cost')}
                  error={(formik.touched.cost ? (formik.errors.cost as string) : undefined)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Selected Addons Mapping - Numbered List */}
            {selectedAddonIds.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="block text-sm font-medium text-primary">ตัวเลือกที่เลือกแล้ว (ลำดับที่จะบันทึก):</label>
                <ol className="list-decimal list-inside space-y-1 pl-4">
                  {selectedAddonIds.map((addonId, index) => {
                    const addon = productAddons.find(a => a.id === addonId);
                    if (!addon) return null;
                    return (
                      <li key={addonId} className="flex items-center justify-between gap-2 py-1 px-2 rounded bg-surface/50 border border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-primary">{index + 1}.</span>
                          <span className="text-sm text-muted-foreground">{addon.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {typeof addon.base_price === 'number' && addon.base_price > 0 ? (
                            <span className="text-sm font-semibold text-primary">+฿{addon.base_price}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">ฟรี</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAddonIds(prev => prev.filter(id => id !== addonId));
                            }}
                            className="text-destructive hover:text-destructive/80 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Available Addons to Select */}
            <div className="space-y-2 pt-2">
              <label className="block text-sm font-medium text-primary">เลือกตัวเลือกเพิ่มเติม:</label>
              {productAddons.filter(addon => !selectedAddonIds.includes(addon.id)).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {productAddons
                    .filter(addon => !selectedAddonIds.includes(addon.id))
                    .map(addon => {
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddonIds(prev => [...prev, addon.id]);
                          }}
                          className="flex items-center gap-3 w-full py-2 px-3 rounded-lg border border-border bg-white hover:bg-surface text-muted-foreground transition-all"
                        >
                          <div className="w-5 h-5 shrink-0 rounded flex items-center justify-center border border-border/60 bg-surface">
                            {/* empty checkbox */}
                          </div>
                          <span className="flex-1 text-left text-sm">{addon.name}</span>
                          {typeof addon.base_price === 'number' && addon.base_price > 0 ? (
                            <span className="text-sm font-semibold text-primary">+฿{addon.base_price}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">ฟรี</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">ไม่มีตัวเลือกเพิ่มเติมให้เลือกแล้ว</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsPreviewOpen(true)} disabled={!formik.isValid || isSubmitting}>
                <Eye className="mr-2 h-4 w-4" aria-hidden />
                แสดงตัวอย่าง
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="destructive" onClick={() => router.push('/management/products')} disabled={isSubmitting}>
                  ยกเลิก
                </Button>
                <Button type="submit" variant="primary" disabled={!formik.isValid || isSubmitting}>
                  <SaveIcon className="mr-2 h-4 w-4" aria-hidden />
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-lg font-bold text-primary">แสดงตัวอย่างสินค้า</h3>
              <button type="button" onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-surface rounded-full transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              <ProductCard
                product={previewProduct}
                category={previewCategory}
                options={previewOptions}
                onAdd={() => {}}
                hideActions
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
