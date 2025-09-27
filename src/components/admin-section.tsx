"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoomSheetData } from '@/lib/schemas';
import { DataTable } from '@/components/data-table';
import AiSummary from '@/components/ai-summary';
import { Lock, Unlock } from 'lucide-react';

const ADMIN_PASSWORD = "admin"; // In a real app, use environment variables

interface AdminSectionProps {
  data: LoomSheetData[];
}

export default function AdminSection({ data }: AdminSectionProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the admin dashboard.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Incorrect password.",
      });
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    toast({
      title: "Logged Out",
      description: "You have successfully logged out from the admin dashboard.",
    });
  }

  return (
    <section id="admin-dashboard">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary font-headline">
          Admin Dashboard
        </h2>
        <p className="mt-1 text-md text-muted-foreground">
          View all submitted data and generate AI-powered insights.
        </p>
      </div>
      
      {!isAuthenticated ? (
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock /> Secure Access</CardTitle>
            <CardDescription>
              Please enter the password to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button onClick={handleLogin}>Login</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
            <div className="flex justify-end">
                <Button variant="outline" onClick={handleLogout}><Unlock className="mr-2 h-4 w-4"/>Logout</Button>
            </div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Loom Data Entries</CardTitle>
                <CardDescription>A complete log of all submitted rolls. You can sort by clicking on column headers.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={data} />
              </CardContent>
            </Card>

            <AiSummary data={data} />
        </div>
      )}
    </section>
  );
}
