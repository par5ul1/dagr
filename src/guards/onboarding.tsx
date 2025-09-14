"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Doc } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  undefined
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

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const userId = session?.user?.id;

  const { data: userConfig, isLoading: isUserConfigLoading } = useGetUserConfig(
    userId || ""
  );
  const { data: goals = [], isLoading: isGoalsLoading } = useGetGoalsByUserId(
    userId || ""
  );

  useEffect(() => {
    if (isSessionPending) {
      setIsLoading(true);
      return;
    }

    if (!userId) {
      setIsOnboardingComplete(true);
      setIsLoading(false);
      return;
    }

    if (isUserConfigLoading || isGoalsLoading) {
      setIsLoading(true);
      return;
    }

    const hasUserConfig = userConfig !== null && userConfig !== undefined;
    const hasGoals = goals && goals.length > 0;
    const hasPreferences =
      userConfig?.preferences?.userPersona ||
      userConfig?.preferences?.motivations;

    const onboardingComplete = Boolean(
      hasUserConfig && hasPreferences && hasGoals
    );
    setIsOnboardingComplete(onboardingComplete);
    setIsLoading(false);
  }, [
    userId,
    isSessionPending,
    isUserConfigLoading,
    isGoalsLoading,
    userConfig,
    goals,
  ]);

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isOnboardingComplete) {
    return <OnboardingPage />;
  }

  return <>{children}</>;
}

function OnboardingPage() {
  const { userConfig, completeOnboarding } = useOnboarding();
  const { data: session } = authClient.useSession();
  const user = session?.user ?? nonNullAssertion("User must be defined");

  const [preferences, setPreferences] = useState({
    userPersona: "",
    motivations: "",
  });

  const [goals, setGoals] = useState([{ title: "", description: "" }]);

  const createUserConfigMutation = useCreateUserConfig();
  const createGoalMutation = useCreateGoal();

  const handleAddGoal = () => {
    setGoals([...goals, { title: "", description: "" }]);
  };

  const handleRemoveGoal = (index: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index));
    }
  };

  const handleGoalChange = (index: number, field: string, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    setGoals(newGoals);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let configId = userConfig?._id;
      if (!configId) {
        const newConfig = await createUserConfigMutation.mutateAsync({
          userId: user.id,
          preferences: {
            userPersona: preferences.userPersona,
            motivations: preferences.motivations,
          },
        });
        configId =
          newConfig?._id ?? nonNullAssertion("Failed to create user config");
      }

      const validGoals = goals.filter((goal) => goal.title.trim() !== "");
      for (const goal of validGoals) {
        await createGoalMutation.mutateAsync({
          userId: user.id,
          title: goal.title,
          description: goal.description || undefined,
        });
      }

      completeOnboarding();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to Dagr!</CardTitle>
          <CardDescription className="text-lg">
            Let's set up your profile and create your first goals to get
            started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Tell us about yourself
                </h2>
                <Separator className="mt-2" />
              </div>

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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivations">Your Motivations</Label>
                  <Textarea
                    id="motivations"
                    placeholder="e.g. I need to leave things for the last minute..."
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
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Create your first goals
                </h2>
                <Separator className="mt-2" />
              </div>

              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <Card key={`goal-${index}-${goal.title}`} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium">Goal {index + 1}</h3>
                      {goals.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGoal(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Goal title (required)"
                        value={goal.title}
                        onChange={(e) =>
                          handleGoalChange(index, "title", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        placeholder="Goal description (optional)"
                        value={goal.description}
                        onChange={(e) =>
                          handleGoalChange(index, "description", e.target.value)
                        }
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddGoal}
                  className="w-full border-dashed"
                >
                  + Add another goal
                </Button>
              </div>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={
                  createUserConfigMutation.isPending ||
                  createGoalMutation.isPending
                }
                className="w-full"
              >
                {createUserConfigMutation.isPending ||
                createGoalMutation.isPending
                  ? "Setting up your account..."
                  : "Complete Setup"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
