"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Rolls', icon: Package },
    { href: '/work-order', label: 'Work Order', icon: FileText },
  ];

  return (
    <div className="flex min-h-screen w-full">
      <aside className="flex h-screen w-64 flex-col border-r bg-background">
        <div className="flex h-16 items-center justify-center border-b">
           <h2 className="text-2xl font-bold tracking-tight text-primary font-headline">
              LoomSheet
           </h2>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === item.href && "bg-muted text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4">
           <p className="text-xs text-muted-foreground">&copy; 2024 LoomSheet</p>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-center border-b bg-background">
           <h1 className="text-xl font-semibold text-primary">
              {navItems.find(item => item.href === pathname)?.label || 'Dashboard'}
           </h1>
        </header>
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
