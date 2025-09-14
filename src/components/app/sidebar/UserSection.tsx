"use client";

import {
  EllipsisVerticalIcon,
  FlameIcon,
  LogOutIcon,
  SlidersHorizontalIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { useGetUserConfig, useUpdateUserConfig } from "@/hooks/useUserConfig";
import { authClient } from "@/lib/authClient";
import { nonNullAssertion } from "@/utils/nonNullAssertion";

export function UserSection() {
  const { isMobile } = useSidebar();

  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth");
        },
      },
    });
  }, [router]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  const user = session?.user ?? nonNullAssertion("User must be defined");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name} />
                ) : (
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name} />
                  ) : (
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  )}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <PreferencesSection />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function PreferencesSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompts, setPrompts] = useState({
    userPersona: "",
    motivations: "",
  });

  const { data: session } = authClient.useSession();
  const user = session?.user ?? nonNullAssertion("User must be defined");

  const { data: userConfig, isLoading: isLoadingConfig } = useGetUserConfig(
    user.id
  );
  useEffect(() => {
    if (userConfig?.preferences) {
      setPrompts({
        userPersona: userConfig.preferences.userPersona || "",
        motivations: userConfig.preferences.motivations || "",
      });
    }
  }, [userConfig]);

  const updateUserConfigMutation = useUpdateUserConfig();

  const handleSave = async () => {
    if (!userConfig?._id) {
      console.error("No user config found");
      return;
    }

    try {
      await updateUserConfigMutation.mutateAsync({
        id: userConfig._id,
        preferences: {
          userPersona: prompts.userPersona,
          motivations: prompts.motivations,
        },
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <SlidersHorizontalIcon />
          Preferences
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
          <DialogDescription>
            Configure your application preferences below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="userPersona" className="text-sm font-medium">
              <UserIcon className="w-4 h-4" />
              Persona
            </Label>
            <Textarea
              id="userPersona"
              placeholder="e.g. I am a software engineer, working from 9am to 6pm most days..."
              value={prompts.userPersona}
              onChange={(e) =>
                setPrompts({ ...prompts, userPersona: e.target.value })
              }
              rows={3}
              disabled={isLoadingConfig}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="motivations" className="text-sm font-medium">
              <FlameIcon className="w-4 h-4" />
              Motivations
            </Label>
            <Textarea
              id="motivations"
              placeholder="e.g. I need to leave things for the last minute..."
              value={prompts.motivations}
              onChange={(e) =>
                setPrompts({ ...prompts, motivations: e.target.value })
              }
              rows={3}
              disabled={isLoadingConfig}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateUserConfigMutation.isPending || isLoadingConfig}
          >
            {updateUserConfigMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
