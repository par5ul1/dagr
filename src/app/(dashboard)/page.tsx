"use client";

import { Send } from "lucide-react";
import { AppSidebar } from "@/app/(dashboard)/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Dashboard() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex w-screen">
        <div className="flex-1 flex flex-col">
          <header className="flex items-center gap-2 p-4 border-b">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </header>
          <main className="flex-1 flex flex-col">
            <div className="flex-1 p-4">
              {/* Main content area - will be filled later */}
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <h2 className="text-2xl font-medium mb-2">Welcome to Dagr</h2>
                  <p className="text-sm">Your main content will appear here</p>
                </div>
              </div>
            </div>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input placeholder="Type your message..." className="flex-1" />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
