import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Download,
  Trash2,
  Edit3,
  Users,
  Calendar,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import {
  calculateDaoStatus,
  calculateDaoProgress,
  type DaoTask,
  type DaoStatus,
  type TeamMember,
} from "@shared/dao";
import TeamEditDialog from "@/components/TeamEditDialog";
import TaskAssignmentDialog from "@/components/TaskAssignmentDialog";
import TaskComments from "@/components/TaskComments";
import { useAuth } from "@/contexts/AuthContext";

function getStatusColor(status: DaoStatus): string {
  switch (status) {
    case "completed":
      return "bg-dao-completed text-white";
    case "urgent":
      return "bg-dao-urgent text-white";
    case "safe":
      return "bg-dao-safe text-white";
    case "default":
      return "bg-dao-default text-white";
  }
}

function TaskRow({
  task,
  daoId,
  onProgressChange,
  onCommentChange,
  onApplicableChange,
  onAssignmentChange,
  availableMembers,
  daysDiff,
  taskIndex,
}: {
  task: DaoTask;
  daoId: string;
  onProgressChange: (taskId: number, progress: number | null) => void;
  onCommentChange: (taskId: number, comment: string) => void;
  onApplicableChange: (taskId: number, applicable: boolean) => void;
  onAssignmentChange: (taskId: number, memberId?: string) => void;
  availableMembers: TeamMember[];
  daysDiff: number;
  taskIndex: number;
}) {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [tempProgress, setTempProgress] = useState(task.progress || 0);
  const [tempComment, setTempComment] = useState(task.comment || "");

  const handleSave = () => {
    onProgressChange(task.id, tempProgress);
    onCommentChange(task.id, tempComment);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempProgress(task.progress || 0);
    setTempComment(task.comment || "");
    setIsEditing(false);
  };

  const getProgressColor = (progress: number): string => {
    // Logique conditionnelle prioritaire :
    // 1. Si % d'avancement = 100% → Gris (priorité absolue)
    if (progress === 100) return "bg-gray-400";

    // 2. Si date dépassée (daysDiff < 0) → Rouge
    if (daysDiff < 0) return "bg-red-500";

    // 3. Si Date dépôt - Date aujourd'hui ≥ 5 jours → Vert
    if (daysDiff >= 5) return "bg-green-500";

    // 4. Si Date dépôt - Date aujourd'hui ≤ 3 jours → Rouge
    if (daysDiff <= 3) return "bg-red-500";

    // 5. Sinon (entre 4 et 5 jours) → Bleu
    return "bg-blue-500";
  };

  const getSliderColor = (progress: number): string => {
    // Même logique que getProgressColor mais retourne des codes couleur hex
    if (progress === 100) return "#9ca3af"; // gris
    if (daysDiff < 0) return "#ef4444"; // rouge pour dates dépassées
    if (daysDiff >= 5) return "#10b981"; // vert
    if (daysDiff <= 3) return "#ef4444"; // rouge
    return "#3b82f6"; // bleu
  };

  // If not applicable, show simple layout
  if (!task.isApplicable) {
    return (
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        {/* Mobile: Vertical layout */}
        <div className="block sm:hidden space-y-3">
          <div className="flex items-start gap-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">
              {taskIndex}
            </span>
            <h4 className="font-medium text-sm flex-1 min-w-0 break-words">
              {task.name}
            </h4>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-muted-foreground">Applicable:</span>
            <div className="flex items-center gap-2">
              {isAdmin() ? (
                <Switch
                  checked={false}
                  onCheckedChange={(checked) =>
                    onApplicableChange(task.id, checked)
                  }
                />
              ) : (
                <span className="text-xs font-medium">Non</span>
              )}
            </div>
          </div>

          <div className="text-center py-2">
            <span className="text-sm text-muted-foreground italic">
              Non applicable
            </span>
          </div>
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:block">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">
                {taskIndex}
              </span>
              {task.name}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Applicable:</span>
              {isAdmin() ? (
                <Switch
                  checked={false}
                  onCheckedChange={(checked) =>
                    onApplicableChange(task.id, checked)
                  }
                />
              ) : (
                <span className="text-xs font-medium">Non</span>
              )}
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-muted-foreground">
              Non applicable
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-3 sm:p-4">
      {/* Mobile: Vertical layout */}
      <div className="block sm:hidden space-y-3">
        <div className="flex items-start gap-2">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">
            {taskIndex}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm break-words mb-2">
              {task.name}
            </h4>

            {/* Progress Bar - Mobile */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Progression
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">
                    {isEditing ? tempProgress : task.progress || 0}%
                  </span>
                  {isAdmin() && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(!isEditing)}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    getProgressColor(
                      isEditing ? tempProgress : task.progress || 0,
                    ),
                  )}
                  style={{
                    width: `${isEditing ? tempProgress : task.progress || 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-muted-foreground">Applicable:</span>
          <div className="flex items-center gap-2">
            {isAdmin() ? (
              <Switch
                checked={task.isApplicable}
                onCheckedChange={(checked) =>
                  onApplicableChange(task.id, checked)
                }
              />
            ) : (
              <span className="text-xs font-medium">
                {task.isApplicable ? "Oui" : "Non"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Horizontal layout */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-2">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">
                {taskIndex}
              </span>
              {task.name}
            </h4>

            {/* Progress Bar - Desktop */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Progression
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">
                    {isEditing ? tempProgress : task.progress || 0}%
                  </span>
                  {isAdmin() && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(!isEditing)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    getProgressColor(
                      isEditing ? tempProgress : task.progress || 0,
                    ),
                  )}
                  style={{
                    width: `${isEditing ? tempProgress : task.progress || 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Applicable:</span>
              {isAdmin() ? (
                <Switch
                  checked={task.isApplicable}
                  onCheckedChange={(checked) =>
                    onApplicableChange(task.id, checked)
                  }
                />
              ) : (
                <span className="text-xs font-medium">
                  {task.isApplicable ? "Oui" : "Non"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode with Slider */}
      {isEditing && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Progress Slider Section */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground block">
              Ajuster le pourcentage:
            </label>
            <div className="px-2 sm:px-4">
              <input
                type="range"
                min="0"
                max="100"
                value={tempProgress}
                onChange={(e) => setTempProgress(Number(e.target.value))}
                className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, ${getSliderColor(tempProgress)} 0%, ${getSliderColor(tempProgress)} ${tempProgress}%, #e5e7eb ${tempProgress}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span className="font-medium">0%</span>
                <span className="font-bold text-primary">{tempProgress}%</span>
                <span className="font-medium">100%</span>
              </div>
            </div>
          </div>

          {/* Comment Section */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground block">
              Commentaire/Observation:
            </label>
            <Textarea
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              placeholder="Ajouter un commentaire ou une observation..."
              className="text-sm resize-none min-h-[80px] border-gray-300 focus:border-primary"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="flex gap-2 order-2 sm:order-1">
              {/* Task Assignment - Admin only */}
              {isAdmin() && (
                <TaskAssignmentDialog
                  currentAssignedTo={task.assignedTo}
                  availableMembers={availableMembers}
                  onAssignmentChange={(memberId) =>
                    onAssignmentChange(task.id, memberId)
                  }
                  taskName={task.name}
                />
              )}
            </div>

            <div className="flex gap-2 ml-auto order-1 sm:order-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments section - always show when not editing */}
      {!isEditing && (
        <TaskComments
          daoId={daoId}
          taskId={task.id}
          taskName={task.name}
          availableMembers={availableMembers}
        />
      )}

      {/* Assignment Section - Visible for applicable tasks (Admin can edit, others just view) */}
      {task.isApplicable && !isEditing && (
        <div className="pt-3 border-t border-gray-100">
          {isAdmin() ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Assignation:
              </span>
              <TaskAssignmentDialog
                currentAssignedTo={task.assignedTo}
                availableMembers={availableMembers}
                onAssignmentChange={(memberId) =>
                  onAssignmentChange(task.id, memberId)
                }
                taskName={task.name}
              />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Assigné à:
              </span>
              <span className="text-xs font-medium">
                {task.assignedTo
                  ? availableMembers.find((m) => m.id === task.assignedTo)
                      ?.name || "Utilisateur inconnu"
                  : "Non assigné"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar - Always at the bottom */}
      {task.isApplicable && !isEditing && (
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Progression
            </span>
            <span className="text-sm font-bold text-primary">
              {task.progress || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                getProgressColor(task.progress || 0),
              )}
              style={{
                width: `${task.progress || 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DaoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [dao, setDao] = useState<Dao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingAuthority, setIsEditingAuthority] = useState(false);
  const [tempAuthority, setTempAuthority] = useState("");

  // Load DAO from API
  useEffect(() => {
    const loadDao = async () => {
      if (!id) {
        setError("ID du DAO manquant");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedDao = await apiService.getDaoById(id);
        setDao(fetchedDao);
      } catch (err) {
        console.error("Error loading DAO:", err);
        setError("Failed to load DAO");
      } finally {
        setLoading(false);
      }
    };

    loadDao();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Chargement du DAO...</p>
        </Card>
      </div>
    );
  }

  // Error or not found state
  if (error || !dao) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>DAO introuvable</CardTitle>
            <CardDescription>
              {error || "Le dossier demandé n'existe pas ou a été supprimé."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link to="/">Retour au tableau de bord</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = calculateDaoProgress(dao.tasks);
  const status = calculateDaoStatus(dao.dateDepot, progress);

  const handleTaskProgressChange = async (
    taskId: number,
    newProgress: number | null,
  ) => {
    if (!dao) return;

    const updatedDao = {
      ...dao,
      tasks: dao.tasks.map((task) =>
        task.id === taskId ? { ...task, progress: newProgress } : task,
      ),
    };

    try {
      // Optimistic update
      setDao(updatedDao);
      // Persist to API
      await apiService.updateDao(dao.id, updatedDao);
    } catch (error) {
      console.error("Error updating task progress:", error);
      // Revert on error
      setDao(dao);
    }
  };

  const handleTaskCommentChange = (taskId: number, newComment: string) => {
    setDao((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((task) =>
              task.id === taskId ? { ...task, comment: newComment } : task,
            ),
          }
        : null,
    );
  };

  const handleTaskApplicableChange = (taskId: number, applicable: boolean) => {
    setDao((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((task) =>
              task.id === taskId ? { ...task, isApplicable: applicable } : task,
            ),
          }
        : null,
    );
  };

  const handleTeamUpdate = (newTeam: TeamMember[]) => {
    setDao((prev) =>
      prev
        ? {
            ...prev,
            equipe: newTeam,
          }
        : null,
    );
  };

  const handleExportPDF = () => {
    // Create a simple PDF export simulation
    const content = `
DAO: ${dao?.numeroListe}
Objet: ${dao?.objetDossier}
Référence: ${dao?.reference}
Autorit��: ${dao?.autoriteContractante}
Date de dépôt: ${dao?.dateDepot}
Progression: ${progress}%

Équipe:
${dao?.equipe.map((m) => `- ${m.name} (${m.role === "chef_equipe" ? "Chef" : "Membre"})`).join("\n")}

Tâches:
${dao?.tasks
  .filter((t) => t.isApplicable)
  .map((t) => `- ${t.name}: ${t.progress || 0}%`)
  .join("\n")}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dao?.numeroListe}_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Tâche", "Applicable", "Progression (%)", "Commentaire"],
      ...dao!.tasks.map((task) => [
        task.name,
        task.isApplicable ? "Oui" : "Non",
        task.isApplicable ? (task.progress || 0).toString() : "N/A",
        task.comment || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dao?.numeroListe}_tasks.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer le DAO ${dao?.numeroListe} ?`,
      )
    ) {
      setIsDeleting(true);
      // Simulate deletion delay
      setTimeout(() => {
        alert("DAO supprimé avec succès");
        navigate("/");
      }, 1000);
    }
  };

  const handleStartEditingAuthority = () => {
    setTempAuthority(dao?.autoriteContractante || "");
    setIsEditingAuthority(true);
  };

  const handleSaveAuthority = () => {
    if (tempAuthority.trim()) {
      setDao((prev) =>
        prev
          ? {
              ...prev,
              autoriteContractante: tempAuthority.trim(),
            }
          : null,
      );
      setIsEditingAuthority(false);
    }
  };

  const handleCancelEditingAuthority = () => {
    setTempAuthority("");
    setIsEditingAuthority(false);
  };

  const handleTaskAssignmentChange = (taskId: number, memberId?: string) => {
    setDao((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((task) =>
              task.id === taskId ? { ...task, assignedTo: memberId } : task,
            ),
          }
        : null,
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const daysDiff = Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const formattedDate = date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return {
      date: formattedDate,
      daysDiff: daysDiff, // Gardons le signe pour la logique conditionnelle
      daysDiffAbs: Math.abs(daysDiff), // Version absolue pour l'affichage
      isOverdue: daysDiff < 0,
    };
  };

  const dateInfo = formatDate(dao.dateDepot);
  const completedTasks = dao.tasks.filter(
    (task) => task.isApplicable && (task.progress || 0) >= 100,
  ).length;
  const inProgressTasks = dao.tasks.filter(
    (task) =>
      task.isApplicable &&
      (task.progress || 0) > 0 &&
      (task.progress || 0) < 100,
  ).length;
  const todoTasks = dao.tasks.filter(
    (task) => task.isApplicable && (task.progress || 0) === 0,
  ).length;
  const applicableTasks = dao.tasks.filter((task) => task.isApplicable).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          {/* Mobile & Tablet Layout */}
          <div className="block lg:hidden">
            {/* First Row: Back button and title */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="flex-shrink-0"
                >
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="ml-1 text-sm">Retour</span>
                  </Link>
                </Button>
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base font-bold truncate">
                      Détails DAO
                    </h1>
                    <p className="text-xs text-muted-foreground truncate">
                      {dao.numeroListe} • {dao.reference}
                    </p>
                  </div>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs font-bold ml-2 flex-shrink-0"
              >
                {progress}%
              </Badge>
            </div>

            {/* Second Row: Action buttons */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    <span className="text-sm">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exporter en PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exporter en CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </span>
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold">Détails DAO</h1>
                  <p className="text-sm text-muted-foreground">
                    {dao.numeroListe} • {dao.reference}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter ce DAO
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exporter en PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exporter en CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Suppression..." : "Supprimer"}
              </Button>
              <Badge variant="secondary" className="text-sm font-bold">
                {progress}% terminé
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* DAO Information */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              {dao.objetDossier}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Référence
                </Label>
                <p className="font-medium">{dao.reference}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Date de dépôt
                </Label>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-sm font-medium",
                      dateInfo.isOverdue
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800",
                    )}
                  >
                    {dateInfo.date} ({dateInfo.daysDiffAbs}j{" "}
                    {dateInfo.isOverdue ? "dépassé" : "restants"})
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">
                    Autorité contractante
                  </Label>
                  {!isEditingAuthority && isAdmin() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleStartEditingAuthority}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {isEditingAuthority ? (
                  <div className="space-y-2">
                    <Input
                      value={tempAuthority}
                      onChange={(e) => setTempAuthority(e.target.value)}
                      placeholder="Saisir l'autorité contractante..."
                      className="font-medium"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveAuthority}>
                        Sauvegarder
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEditingAuthority}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="font-medium">{dao.autoriteContractante}</p>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avancement global</span>
                <span className="text-2xl font-bold">{progress}%</span>
              </div>
              <Progress
                value={progress}
                className={cn(
                  "h-4",
                  progress === 100 ? "[&>*]:bg-gray-400" : "",
                )}
              />

              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-xl md:text-2xl font-bold text-green-600">
                    {completedTasks}
                  </div>
                  <div className="text-xs text-muted-foreground">Terminées</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-blue-600">
                    {inProgressTasks}
                  </div>
                  <div className="text-xs text-muted-foreground">En cours</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-gray-600">
                    {todoTasks}
                  </div>
                  <div className="text-xs text-muted-foreground">À faire</div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Chef d'équipe</Label>
                {isAdmin() && (
                  <TeamEditDialog
                    currentTeam={dao.equipe}
                    onTeamUpdate={handleTeamUpdate}
                    type="chef"
                  />
                )}
              </div>
              <p className="font-medium break-words">
                {dao.equipe.find((m) => m.role === "chef_equipe")?.name ||
                  "Non assigné"}
              </p>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Membres d'équipe</Label>
                {isAdmin() && (
                  <TeamEditDialog
                    currentTeam={dao.equipe}
                    onTeamUpdate={handleTeamUpdate}
                    type="membres"
                  />
                )}
              </div>
              <div className="space-y-2">
                {dao.equipe
                  .filter((m) => m.role === "membre_equipe")
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <span className="font-medium break-words">
                        {member.name}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Detail */}
        <Card>
<<<<<<< HEAD
          <CardHeader>
            <CardTitle>Détail des tâches</CardTitle>
=======
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <CardTitle className="text-lg sm:text-xl font-bold">
                Détail des tâches
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">
                  {applicableTasks} tâches applicables
                </span>
                <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                <span className="text-xs text-muted-foreground">
                  {dao.tasks.length} total
                </span>
              </div>
            </div>
>>>>>>> refs/remotes/origin/ai_main_2de68e2717cc
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-3 sm:space-y-4">
              {dao.tasks.map((task, index) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  daoId={dao.id}
                  onProgressChange={handleTaskProgressChange}
                  onCommentChange={handleTaskCommentChange}
                  onApplicableChange={handleTaskApplicableChange}
                  onAssignmentChange={handleTaskAssignmentChange}
                  availableMembers={dao.equipe}
                  daysDiff={dateInfo.daysDiff}
                  taskIndex={index + 1}
                />
              ))}
            </div>

            {/* Total applicable tasks count */}
            <div className="flex justify-center pt-4 mt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Total :
                </span>
                <span className="text-sm font-bold text-primary">
                  {applicableTasks} tâches applicables
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={className}>{children}</label>;
}
