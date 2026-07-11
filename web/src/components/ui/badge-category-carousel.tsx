'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/category';

export interface BadgeCategoryCarouselProps {
  categories: Category[];
  selectedCategories: number[];
  onToggleCategory: (categoryId: number) => void;
  className?: string;
}

/**
 * BadgeCategoryCarousel - A horizontally scrollable carousel of category badges.
 * Supports multiple selection and hides the scrollbar.
 */
export function BadgeCategoryCarousel({
  categories,
  selectedCategories,
  onToggleCategory,
  className,
}: BadgeCategoryCarouselProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <div className="scrollbar-hide flex overflow-x-auto gap-2 pb-3 px-1 -mx-1">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <button
              key={category.id}
              onClick={() => onToggleCategory(category.id)}
              className={cn(
                'flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                isSelected
                  ? 'bg-primary text-white shadow-md border border-border'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 shadow-md border border-border'
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BadgeCategoryCarousel;
