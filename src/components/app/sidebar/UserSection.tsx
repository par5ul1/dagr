"use client";

import {
  CalendarIcon,
  CalendarOffIcon,
  EllipsisVerticalIcon,
  FlameIcon,
  Link2Icon,
  LogOutIcon,
  PaintbrushIcon,
  SlidersHorizontalIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetUserConfig,
  useSyncGoogleCalendarWithUserConfig,
  useUpdateUserConfig,
} from "@/hooks/useUserConfig";
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
            <IntegrationSection />
            <ThemeSwitcher />
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

function PreferencesSection() {
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

function IntegrationSection() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const user = session?.user ?? nonNullAssertion("User must be defined");

  const { data: userConfig, isLoading: isLoadingConfig } = useGetUserConfig(
    user.id
  );

  const syncGoogleCalendarMutation = useSyncGoogleCalendarWithUserConfig();
  const handleSyncGoogleCalendar = async () => {
    if (!userConfig?._id) return;
    await syncGoogleCalendarMutation.mutateAsync({
      userId: user.id,
      userConfigId: userConfig._id,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Link2Icon />
          Integration
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Integration</DialogTitle>
          <DialogDescription>
            Configure your Google Calendar integration below.
          </DialogDescription>
        </DialogHeader>
        {isLoadingConfig ? (
          <Skeleton className="w-full h-64 rounded-md" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardContent className="flex flex-col items-center gap-2 px-0 mt-4">
                {userConfig?.calendars.items ? (
                  userConfig.calendars.items.map((calendar) => (
                    <div
                      className="w-full grid grid-cols-[24px_1fr] gap-1 text-sm bg-muted p-1 rounded-md items-center"
                      key={calendar.id}
                    >
                      <CalendarIcon className="w-4 h-4" />
                      {calendar.summary}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarOffIcon className="w-4 h-4" />
                    No calendars found
                  </div>
                )}
              </CardContent>
            </CardHeader>
          </Card>
        )}
        <DialogFooter>
          <Button
            onClick={handleSyncGoogleCalendar}
            disabled={syncGoogleCalendarMutation.isPending}
          >
            {syncGoogleCalendarMutation.isPending
              ? "Syncing..."
              : "Sync Google Calendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuItem
      className="flex items-center gap-2"
      onSelect={(e) => e.preventDefault()}
    >
      <PaintbrushIcon />
      Theme
      <Select value={theme} onValueChange={(value) => setTheme(value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>
    </DropdownMenuItem>
  );
}
