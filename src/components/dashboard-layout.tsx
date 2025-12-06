
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, FileText } from 'lucide-react';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Rolls', icon: Package },
    { href: '/work-order', label: 'Work Order', icon: FileText },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent className="flex flex-col">
          <SidebarHeader>
             <h2 className="text-2xl font.bold tracking-tight text-primary font-headline group-data-[collapsible=icon]:hidden">
                LoomSheet
             </h2>
          </SidebarHeader>
          <SidebarMenu className="flex-1">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarFooter className="group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-muted-foreground">&copy; 2024 LoomSheet</p>
          </SidebarFooter>
        </SidebarContent>
        <SidebarInset>
            <header className="flex items-center justify-between p-4 border-b">
                <SidebarTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Package className="h-5 w-5"/>
                    </Button>
                </SidebarTrigger>
                <h1 className="text-xl font-semibold text-primary">
                    {navItems.find(item => item.href === pathname)?.label || 'Dashboard'}
                </h1>
                <div className="w-8"></div>
            </header>
            <main className="p-4 md:p-8">
                {children}
            </main>
        </SidebarInset>
      </Sidebar>
    </SidebarProvider>
  );
}
