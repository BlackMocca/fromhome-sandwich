'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { openMobileSidebar } from './mobile-sidebar';
import { logoutAction } from '@/lib/auth-actions';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';

export default function Navbar() {
  const { authUser, clearAuthUser } = useAuth();
  const { totalQuantity } = useOrder();
  const isLoggedIn = !!authUser;
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="shadow-md md:shadow-sm px-4 py-3 bg-white sticky top-0 z-50 rounded-b">
      <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto">
        {/* Left side: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger button for mobile/tablet */}
          <button
            onClick={openMobileSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="เปิดเมนู"
          >
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <a href="/management" className="text-primary font-bold text-base sm:text-lg tracking-tight flex items-center gap-2">
            <div className="w-10 h-10 rounded inline-block"> 
              <img className='w-full h-full' src="/images/logo.png" />
            </div>
            From Home Sandwich
          </a>
        </div>

        {/* Right side: Billing icon + User menu */}
        <div className="flex items-center gap-2">
          {/* Billing icon */}
          {isLoggedIn && (
            <Link
              href="/management/orders/draft"
              className="relative p-2 rounded-lg hover:bg-surface transition-colors"
              aria-label="รายการบิล"
            >
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              {totalQuantity > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-action text-white text-[10px] font-bold px-1 leading-none">
                  {totalQuantity}
                </span>
              )}
            </Link>
          )}

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex text-white items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface transition-colors text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center text-secondary text-xs font-bold overflow-hidden">
                    {authUser?.profile?.display_name?.charAt(0)?.toUpperCase() ?? 
                     authUser?.user?.email?.charAt(0)?.toUpperCase() ?? 'A'}
                  </div>
                  <span className="text-primary/80 hidden sm:inline">
                    {authUser?.profile?.display_name ?? authUser?.user?.email?.split('@')[0] ?? 'Admin'}
                  </span>
                  <svg className="w-3 h-3 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown card */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        clearAuthUser();
                        logoutAction();
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-primary hover:bg-surface transition-colors"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </>
            ) : (
              <a href="/auth/login" className="text-primary font-medium">เข้าสู่ระบบ</a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
