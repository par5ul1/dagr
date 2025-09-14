"use client";

import { FileText, Home, MessageSquare, Settings } from "lucide-react";
import Image from "next/image";
import logo from "@/app/icon.png";
import { UserSection } from "@/components/app/sidebar/UserSection";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import GoalsSection from "./GoalsSection";

export default function SidebarComponent() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Image src={logo.src} alt="Dagr" width={32} height={32} />
          <span className="font-semibold">Dagr</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <GoalsSection />
      </SidebarContent>
      <SidebarFooter>
        <UserSection />
      </SidebarFooter>
    </Sidebar>
  );
}
