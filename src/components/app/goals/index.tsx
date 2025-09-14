import { CheckIcon, PencilIcon } from "lucide-react";
import type { Doc } from "@/../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type GoalCardProps = {
  goal: Doc<"goals">;
  isSelected?: boolean;
  onEdit?: (goal: Doc<"goals">) => void;
  onSelect?: (goal: Doc<"goals">) => void;
  onUnselect?: (goal: Doc<"goals">) => void;
};
const PRIORITIES = [
  {
    label: "Low",
    color: "bg-green-400/80",
    value: 1,
  },
  {
    label: "Medium",
    color: "bg-yellow-400/80",
    value: 2,
  },
  {
    label: "High",
    color: "bg-red-400/80",
    value: 3,
  },
];

function GoalCard({
  goal,
  isSelected,
  onEdit,
  onSelect,
  onUnselect,
}: GoalCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          {goal.title}
          <Badge
            variant="default"
            className={PRIORITIES.find((p) => p.value === goal.priority)?.color}
          >
            {PRIORITIES.find((p) => p.value === goal.priority)?.label}
          </Badge>
        </CardTitle>
        {goal.description && (
          <CardDescription>{goal.description}</CardDescription>
        )}
        <CardContent className="pt-2 px-0 flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            {goal.progress * 100}%
          </span>
          <Progress value={goal.progress * 100} />
        </CardContent>
        <CardFooter className="flex gap-2 justify-end mt-2 px-0">
          {onEdit ? (
            <Button size="sm" variant="secondary" onClick={() => onEdit(goal)}>
              <PencilIcon className="w-4 h-4" />
              Edit
            </Button>
          ) : null}
          {onSelect && onUnselect ? (
            <Button
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={() => (isSelected ? onUnselect(goal) : onSelect(goal))}
            >
              <CheckIcon className="w-4 h-4" />
              {isSelected ? "Selected" : "Select"}
            </Button>
          ) : null}
        </CardFooter>
      </CardHeader>
    </Card>
  );
}
function GoalForm({
  fields,
  setFields,
}: {
  fields: {
    name: string;
    description: string;
    priority?: number;
  };
  setFields: (fields: {
    name: string;
    description: string;
    priority: number;
  }) => void;
}) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-search">Goal</Label>
        <Input
          defaultValue={fields.name}
          onChange={(e) =>
            setFields({
              ...fields,
              name: e.target.value,
              priority: fields.priority || 1,
            })
          }
          id="goal-search"
          placeholder="e.g. Schedule dentist appointment"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-description">Description</Label>
        <Textarea
          defaultValue={fields.description}
          onChange={(e) =>
            setFields({
              ...fields,
              description: e.target.value,
              priority: fields.priority || 1,
            })
          }
          id="goal-description"
          placeholder="e.g. I need to schedule a dentist appointment"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-priority">Priority</Label>
        <Select
          defaultValue={fields.priority?.toString() || "1"}
          onValueChange={(e) =>
            setFields({ ...fields, priority: parseInt(e, 10) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Low</SelectItem>
            <SelectItem value="2">Medium</SelectItem>
            <SelectItem value="3">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export { GoalCard, GoalForm };
