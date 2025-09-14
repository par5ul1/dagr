import { PlusIcon, SearchIcon, Settings2Icon } from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import {
  useCreateGoal,
  useDeleteGoal,
  useGetGoalsByUserId,
  useUpdateGoal,
} from "@/hooks/useGoals";
import { authClient } from "@/lib/authClient";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { GoalCard, GoalForm } from "../goals";

export default function GoalsSection() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex justify-between text-sm">
        This Week&apos;s Goals
        <ManageGoalsModal />
      </SidebarGroupLabel>
    </SidebarGroup>
  );
}

enum ManageGoalsModalView {
  Manage,
  Create,
  Edit,
}

function ManageGoalsModal() {
  const [view, setView] = useState<ManageGoalsModalView>(
    ManageGoalsModalView.Manage
  );
  const [goalToEdit, setGoalToEdit] = useState<Doc<"goals"> | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings2Icon className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      {(() => {
        switch (view) {
          case ManageGoalsModalView.Manage:
            return (
              <ManageGoalsModalManageView
                setView={setView}
                setGoalToEdit={setGoalToEdit}
              />
            );
          case ManageGoalsModalView.Create:
            return <ManageGoalsModalCreateView setView={setView} />;
          case ManageGoalsModalView.Edit:
            return (
              <ManageGoalsModalEditView setView={setView} goal={goalToEdit} />
            );
        }
      })()}
    </Dialog>
  );
}
function ManageGoalsModalManageView({
  setView,
  setGoalToEdit,
}: {
  setView: (view: ManageGoalsModalView) => void;
  setGoalToEdit: (goal: Doc<"goals"> | null) => void;
}) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const { data: goals = [], isLoading } = useGetGoalsByUserId(userId || "");

  const [search, setSearch] = useState("");

  const handleCreate = () => {
    setView(ManageGoalsModalView.Create);
  };

  const handleEdit = (goal: Doc<"goals">) => {
    setView(ManageGoalsModalView.Edit);
    setGoalToEdit(goal);
  };

  const filteredGoals = goals.filter(
    (goal) =>
      goal.title.toLowerCase().includes(search.toLowerCase()) ||
      goal.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DialogContent className="w-4/5 h-4/5 !max-w-none grid-rows-[auto_1fr]">
      <DialogHeader>
        <DialogTitle>Manage Goals</DialogTitle>
        <DialogDescription>
          Select, create, or edit your goals for the week.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-rows-[auto_1fr] gap-4 h-full overflow-hidden p-1">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 items-end">
          <Input
            leftAdornment={
              <SearchIcon className="w-4 h-4 text-muted-foreground" />
            }
            id="goal-search"
            placeholder="e.g. Schedule dentist appointment"
            defaultValue={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Separator orientation="vertical" />
          <Button variant="outline" onClick={handleCreate}>
            <PlusIcon className="w-4 h-4" />
            Create New Goal
          </Button>
        </div>
        <ScrollArea>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Loading goals...
              </div>
            ) : goals.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No goals yet. Create your first goal!
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No goals found for search "{search}". Try searching for a
                different keyword or creating a new goal.
              </div>
            ) : (
              filteredGoals.map((goal) => (
                <GoalCard
                  key={goal._id}
                  goal={goal}
                  onEdit={handleEdit}
                  onSelect={() => {}}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      <DialogFooter>
        <Button type="submit">Select Goals</Button>
      </DialogFooter>
    </DialogContent>
  );
}
function ManageGoalsModalCreateView({
  setView,
}: {
  setView: (view: ManageGoalsModalView) => void;
}) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const createGoalMutation = useCreateGoal();

  const [fields, setFields] = useState<{
    name: string;
    description: string;
    priority: number;
  }>({
    name: "",
    description: "",
    priority: 1,
  });

  const handleCreate = async () => {
    if (!userId || !fields.name.trim()) return;

    try {
      await createGoalMutation.mutateAsync({
        userId,
        title: fields.name,
        description: fields.description || undefined,
        priority: fields.priority,
      });
      setView(ManageGoalsModalView.Manage);
    } catch (error) {
      console.error("Failed to create goal:", error);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Goal</DialogTitle>
      </DialogHeader>
      <GoalForm fields={fields} setFields={setFields} />
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setView(ManageGoalsModalView.Manage)}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={createGoalMutation.isPending || !fields.name.trim()}
        >
          {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
function ManageGoalsModalEditView({
  setView,
  goal,
}: {
  setView: (view: ManageGoalsModalView) => void;
  goal: Doc<"goals"> | null;
}) {
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const [fields, setFields] = useState<{
    name: string;
    description: string;
    priority: number;
  }>({
    name: goal?.title || "",
    description: goal?.description || "",
    priority: goal?.priority || 1,
  });

  const handleSave = async () => {
    if (!goal || !fields.name.trim()) return;

    try {
      await updateGoalMutation.mutateAsync({
        goalId: goal._id,
        title: fields.name,
        description: fields.description || undefined,
        priority: fields.priority,
      });
      setView(ManageGoalsModalView.Manage);
    } catch (error) {
      console.error("Failed to update goal:", error);
    }
  };

  const handleDelete = async () => {
    if (!goal || !fields.name.trim()) return;
    try {
      await deleteGoalMutation.mutateAsync({
        goalId: goal._id,
      });
      setView(ManageGoalsModalView.Manage);
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Goal</DialogTitle>
      </DialogHeader>
      <GoalForm fields={fields} setFields={setFields} />
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setView(ManageGoalsModalView.Manage)}
        >
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          {deleteGoalMutation.isPending ? "Deleting..." : "Delete Goal"}
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateGoalMutation.isPending || !fields.name.trim()}
        >
          {updateGoalMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
