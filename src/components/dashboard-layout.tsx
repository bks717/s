
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, FileText, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { UndoConfirmationDialog } from './undo-confirmation-dialog';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onUndo?: () => void;
  canUndo?: boolean;
}

export function DashboardLayout({ children, onUndo, canUndo }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isUndoDialogVisible, setIsUndoDialogVisible] = useState(false);

  const navItems = [
    { href: '/', label: 'Rolls', icon: Package },
    { href: '/work-order', label: 'Work Order', icon: FileText },
  ];

  const handleUndoConfirm = () => {
    if (onUndo) {
      onUndo();
    }
    setIsUndoDialogVisible(false);
  };

  return (
    <>
      <UndoConfirmationDialog
        isOpen={isUndoDialogVisible}
        onClose={() => setIsUndoDialogVisible(false)}
        onConfirm={handleUndoConfirm}
      />
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
          <header className="flex h-16 items-center justify-between border-b bg-background px-8">
            <h1 className="text-xl font-semibold text-primary">
                {navItems.find(item => item.href === pathname)?.label || 'Dashboard'}
            </h1>
             {onUndo && (
                <Button variant="destructive" onClick={() => setIsUndoDialogVisible(true)} disabled={!canUndo}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Undo Last Action
                </Button>
            )}
          </header>
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
