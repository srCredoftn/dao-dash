import { useState } from "react";
import { FileText, Download } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { type DaoTask, type DaoStatus } from "@shared/dao";

type ExportFormat = "PDF" | "CSV";

interface ExportOptions {
  includeTodos: boolean;
  includeInProgress: boolean;
  includeCompleted: boolean;
  includeNotApplicable: boolean;
  format: ExportFormat;
}

interface ExportFilterDialogProps {
  tasks: DaoTask[];
  onExport: (options: ExportOptions) => void;
  children: React.ReactNode;
}

export default function ExportFilterDialog({ 
  tasks, 
  onExport, 
  children 
}: ExportFilterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    includeTodos: true,
    includeInProgress: true,
    includeCompleted: true,
    includeNotApplicable: false,
    format: "PDF"
  });

  // Calculer les statistiques des tâches
  const todoTasks = tasks.filter(task => task.isApplicable && (task.progress || 0) === 0);
  const inProgressTasks = tasks.filter(task => task.isApplicable && (task.progress || 0) > 0 && (task.progress || 0) < 100);
  const completedTasks = tasks.filter(task => task.isApplicable && (task.progress || 0) >= 100);
  const notApplicableTasks = tasks.filter(task => !task.isApplicable);

  const handleExport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onExport(options);
    setIsOpen(false);
  };

  const handleFormatChange = (format: ExportFormat) => {
    setOptions(prev => ({ ...prev, format }));
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const getSelectedTasksCount = () => {
    let count = 0;
    if (options.includeTodos) count += todoTasks.length;
    if (options.includeInProgress) count += inProgressTasks.length;
    if (options.includeCompleted) count += completedTasks.length;
    if (options.includeNotApplicable) count += notApplicableTasks.length;
    return count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Options d'export
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les tâches à inclure dans l'export et le format souhaité.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Format d'export</h4>
            <div className="flex gap-2">
              <Button
                variant={options.format === "PDF" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFormatChange("PDF")}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant={options.format === "CSV" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFormatChange("CSV")}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>

          <Separator />

          {/* Task Status Filters */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Statut des tâches à inclure</h4>
            
            <div className="space-y-3">
              {/* À faire */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="todos"
                    checked={options.includeTodos}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeTodos: checked as boolean }))
                    }
                  />
                  <label
                    htmlFor="todos"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    À faire
                  </label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {todoTasks.length}
                </Badge>
              </div>

              {/* En cours */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="inprogress"
                    checked={options.includeInProgress}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeInProgress: checked as boolean }))
                    }
                  />
                  <label
                    htmlFor="inprogress"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    En cours
                  </label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {inProgressTasks.length}
                </Badge>
              </div>

              {/* Terminées */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="completed"
                    checked={options.includeCompleted}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeCompleted: checked as boolean }))
                    }
                  />
                  <label
                    htmlFor="completed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Terminées
                  </label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {completedTasks.length}
                </Badge>
              </div>

              {/* Non applicables */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="notapplicable"
                    checked={options.includeNotApplicable}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeNotApplicable: checked as boolean }))
                    }
                  />
                  <label
                    htmlFor="notapplicable"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Non applicables
                  </label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {notApplicableTasks.length}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tâches sélectionnées:</span>
              <span className="font-medium">{getSelectedTasksCount()} / {tasks.length}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={getSelectedTasksCount() === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter {options.format}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { ExportOptions };
