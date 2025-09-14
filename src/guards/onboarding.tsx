"use client";

import {
  LogOutIcon,
  PlusIcon,
  RocketIcon,
  TargetIcon,
  UserIcon,
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Doc } from "@/../convex/_generated/dataModel";
import { GoalCard, GoalForm } from "@/components/app/goals";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Interstitial from "@/components/ui/interstitial";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGoal, useGetGoalsByUserId } from "@/hooks/useGoals";
import { useCreateUserConfig, useGetUserConfig } from "@/hooks/useUserConfig";
import { authClient } from "@/lib/authClient";
import { nonNullAssertion } from "@/utils/nonNullAssertion";

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  isLoading: boolean;
  userConfig: Doc<"userConfig"> | null;
  goals: Doc<"goals">[];
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

enum OnboardingPage {
  Welcome,
  Persona,
  Goals,
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const userId = session?.user?.id;

  const { data: userConfig, isLoading: isUserConfigLoading } = useGetUserConfig(
    userId || "",
  );
  const { data: goals = [] } = useGetGoalsByUserId(userId || "");

  useEffect(() => {
    if (isSessionPending) {
      setIsLoading(true);
      return;
    }

    if (isUserConfigLoading) {
      setIsLoading(true);
      return;
    }

    if (!userId) {
      setIsOnboardingComplete(true);
      setIsLoading(false);
      return;
    }

    const hasUserConfig = userConfig !== null && userConfig !== undefined;

    const onboardingComplete = Boolean(hasUserConfig);
    setIsOnboardingComplete(onboardingComplete);
    setIsLoading(false);
  }, [userId, isSessionPending, isUserConfigLoading, userConfig]);

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
  };

  const value: OnboardingContextType = {
    isOnboardingComplete,
    isLoading,
    userConfig: userConfig ?? null,
    goals,
    completeOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isOnboardingComplete, isLoading } = useOnboarding();

  if (isLoading) {
    return <Interstitial message="Loading..." />;
  }

  if (!isOnboardingComplete) {
    return <OnboardingFlow />;
  }

  return <>{children}</>;
}

function OnboardingFlow() {
  const [currentPage, setCurrentPage] = useState<OnboardingPage>(
    OnboardingPage.Welcome,
  );
  const [preferences, setPreferences] = useState({
    userPersona: "",
    motivations: "",
  });

  const { goals, completeOnboarding } = useOnboarding();
  const { data: session } = authClient.useSession();
  const user = session?.user ?? nonNullAssertion("User must be defined");

  const createUserConfigMutation = useCreateUserConfig();

  const handleLogout = async () => {
    await authClient.signOut();
  };

  const handleNext = () => {
    if (currentPage === OnboardingPage.Welcome) {
      setCurrentPage(OnboardingPage.Persona);
    } else if (currentPage === OnboardingPage.Persona) {
      setCurrentPage(OnboardingPage.Goals);
    }
  };

  const handleBack = () => {
    if (currentPage === OnboardingPage.Persona) {
      setCurrentPage(OnboardingPage.Welcome);
    } else if (currentPage === OnboardingPage.Goals) {
      setCurrentPage(OnboardingPage.Persona);
    }
  };

  const handlePersonaSubmit = () => {
    setCurrentPage(OnboardingPage.Goals);
  };

  const handleComplete = async () => {
    try {
      await createUserConfigMutation.mutateAsync({
        userId: user.id,
        preferences: {
          userPersona: preferences.userPersona,
          motivations: preferences.motivations,
        },
      });

      completeOnboarding();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  const getProgressValue = () => {
    switch (currentPage) {
      case OnboardingPage.Welcome:
        return 33;
      case OnboardingPage.Persona:
        return 66;
      case OnboardingPage.Goals:
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      <Button variant="outline" onClick={handleLogout} className="mr-auto">
        <LogOutIcon className="w-4 h-4" />
        Logout
      </Button>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <Progress value={getProgressValue()} className="h-1 max-w-2xl w-full" />

        <Card className="max-w-2xl w-full">
          {currentPage === OnboardingPage.Welcome && (
            <WelcomePage onNext={handleNext} />
          )}
          {currentPage === OnboardingPage.Persona && (
            <PersonaPage
              preferences={preferences}
              setPreferences={setPreferences}
              onNext={handlePersonaSubmit}
              onBack={handleBack}
              isLoading={createUserConfigMutation.isPending}
            />
          )}
          {currentPage === OnboardingPage.Goals && (
            <GoalsPage
              goals={goals}
              onComplete={handleComplete}
              onBack={handleBack}
              createUserConfigMutation={createUserConfigMutation}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function WelcomePage({ onNext }: { onNext: () => void }) {
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Welcome to Dagr!</CardTitle>
        <CardDescription className="text-lg">
          Your personal productivity companion that helps you stay organized and
          achieve your goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">What is Dagr?</h3>
            <p className="text-muted-foreground">
              Dagr is a smart task management system that learns from your
              preferences and helps you prioritize your work effectively. We'll
              help you set up your profile and create your first goals to get
              started.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <UserIcon />
              </div>
              <h4 className="font-medium">Personal Profile</h4>
              <p className="text-sm text-muted-foreground">
                Tell us about yourself
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <TargetIcon />
              </div>
              <h4 className="font-medium">Set Goals</h4>
              <p className="text-sm text-muted-foreground">
                Create your first goals
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <RocketIcon />
              </div>
              <h4 className="font-medium">Get Started</h4>
              <p className="text-sm text-muted-foreground">
                Begin your journey
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-0">
        <Button type="button" onClick={onNext} className="w-full" size="lg">
          Let's Get Started
        </Button>
      </CardContent>
    </>
  );
}

function PersonaPage({
  preferences,
  setPreferences,
  onNext,
  onBack,
  isLoading,
}: {
  preferences: { userPersona: string; motivations: string };
  setPreferences: (prefs: { userPersona: string; motivations: string }) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Tell us about yourself
        </CardTitle>
        <CardDescription className="text-base">
          This information helps us personalize your experience and provide
          better recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userPersona">Your Persona</Label>
            <Textarea
              id="userPersona"
              placeholder="e.g. I am a software engineer, working from 9am to 6pm most days..."
              value={preferences.userPersona}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  userPersona: e.target.value,
                })
              }
              rows={3}
              required
            />
            <p className="text-sm text-muted-foreground">
              Describe your role, work schedule, and typical day to help us
              understand your context.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivations">Your Motivations & Challenges</Label>
            <Textarea
              id="motivations"
              placeholder="e.g. I tend to procrastinate on important tasks and need help staying focused..."
              value={preferences.motivations}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  motivations: e.target.value,
                })
              }
              rows={3}
              required
            />
            <p className="text-sm text-muted-foreground">
              Share what motivates you and what challenges you face with
              productivity.
            </p>
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-0">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={onNext}
            className="flex-1"
            disabled={
              !preferences.userPersona.trim() ||
              !preferences.motivations.trim() ||
              isLoading
            }
          >
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </CardContent>
    </>
  );
}

function GoalsPage({
  goals,
  onComplete,
  onBack,
  createUserConfigMutation,
}: {
  goals: Doc<"goals">[];
  onComplete: () => void;
  onBack: () => void;
  createUserConfigMutation: ReturnType<typeof useCreateUserConfig>;
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [goalFields, setGoalFields] = useState({
    name: "",
    description: "",
    priority: 1,
  });

  const { data: session } = authClient.useSession();
  const user = session?.user ?? nonNullAssertion("User must be defined");
  const createGoalMutation = useCreateGoal();

  const handleCreateGoal = async () => {
    if (!goalFields.name.trim()) return;

    try {
      await createGoalMutation.mutateAsync({
        userId: user.id,
        title: goalFields.name,
        description: goalFields.description || undefined,
        priority: goalFields.priority,
      });

      setGoalFields({ name: "", description: "", priority: 1 });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create goal:", error);
    }
  };

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Create your first goal
        </CardTitle>
        <CardDescription className="text-base">
          Goals help you stay focused and track your progress. You can create
          goals now or add them later from the main app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Your Goals</h3>
            <div className="space-y-3">
              {goals.map((goal) => (
                <GoalCard key={goal._id} goal={goal} />
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="gap-2">
                <PlusIcon className="w-4 h-4" />
                {goals.length === 0
                  ? "Create Your First Goal"
                  : "Add Another Goal"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
                <DialogDescription>
                  Add a new goal to track your progress and stay motivated.
                </DialogDescription>
              </DialogHeader>
              <GoalForm fields={goalFields} setFields={setGoalFields} />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateGoal}
                  disabled={
                    !goalFields.name.trim() || createGoalMutation.isPending
                  }
                >
                  {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
      <CardContent className="pt-0">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={onComplete}
            className="flex-1"
            disabled={createUserConfigMutation.isPending}
          >
            {createUserConfigMutation.isPending
              ? "Completing..."
              : "Complete Setup"}
          </Button>
        </div>
      </CardContent>
    </>
  );
}
