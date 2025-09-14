"use client";

import Image from "next/image";
import logo from "@/app/icon.png";
import { UserSection } from "@/components/app/sidebar/UserSection";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import type { Doc } from "../../../../convex/_generated/dataModel";
import GoalsSection from "./GoalsSection";

export default function SidebarComponent({
  selectedGoals,
  setSelectedGoals,
}: {
  selectedGoals: Doc<"goals">[];
  setSelectedGoals: (goals: Doc<"goals">[]) => void;
}) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Image src={logo.src} alt="Dagr" width={32} height={32} />
          <span className="font-semibold">Dagr</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <GoalsSection
          selectedGoals={selectedGoals}
          setSelectedGoals={setSelectedGoals}
        />
      </SidebarContent>
      <SidebarFooter>
        <UserSection />
      </SidebarFooter>
    </Sidebar>
  );
}
