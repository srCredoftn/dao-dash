import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import NewDaoDialog from "@/components/NewDaoDialog";
import FilterDialog from "@/components/FilterDialog";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import { testProgressCalculations } from "@/utils/test-calculations";
import { testGlobalStatistics } from "@/utils/test-global-stats";
import { runAllTests } from "@/utils/test-dao-functionality";
import {
  calculateDaoStatus,
  calculateDaoProgress,
  type Dao,
  type DaoStatus,
  type DaoFilters,
} from "@shared/dao";

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

function getStatusBadgeVariant(
  status: DaoStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "secondary";
    case "urgent":
      return "destructive";
    case "safe":
      return "default";
    case "default":
      return "outline";
  }
}

function getStatusLabel(status: DaoStatus): string {
  switch (status) {
    case "completed":
      return "Terminé";
    case "urgent":
      return "Urgent";
    case "safe":
      return "En avance";
    case "default":
      return "En cours";
  }
}

function DaoCard({ dao }: { dao: Dao }) {
  const progress = calculateDaoProgress(dao.tasks);
  const status = calculateDaoStatus(dao.dateDepot, progress);
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the expand button or detail button
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-navigate]")) {
      return;
    }
    navigate(`/dao/${dao.id}`);
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow relative group cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-semibold">
              {dao.numeroListe}
            </CardTitle>
            <CardDescription
              className="text-sm font-medium line-clamp-2"
              title={dao.objetDossier}
            >
              {dao.objetDossier}
            </CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Always visible: Date and Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Date de dépôt:</span>
            <span
              className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                getStatusColor(status),
              )}
            >
              {formatDate(dao.dateDepot)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression:</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className={cn("h-2", progress === 100 ? "[&>*]:bg-gray-400" : "")}
            />
          </div>
        </div>

        {/* Mobile expand/collapse button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            data-no-navigate
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Moins d'infos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Plus d'infos
              </>
            )}
          </Button>
        </div>

        {/* Collapsible content for mobile / Always visible on desktop */}
        <div
          className={cn(
            "space-y-4",
            "md:block", // Always visible on desktop
            isExpanded ? "block" : "hidden", // Conditional on mobile
          )}
        >
          {/* Reference and Team Leader - First row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Référence:</span>
              <p className="font-medium truncate" title={dao.reference}>
                {dao.reference}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Chef d'équipe
                </p>
                <p
                  className="text-sm font-medium text-foreground truncate"
                  title={
                    dao.equipe.find((m) => m.role === "chef_equipe")?.name ||
                    "Non assigné"
                  }
                >
                  {dao.equipe.find((m) => m.role === "chef_equipe")?.name ||
                    "Non assigné"}
                </p>
              </div>
            </div>
          </div>

          {/* Authority and Team Members - Second row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">
                Autorité Contractante:
              </span>
              <p
                className="font-medium truncate"
                title={dao.autoriteContractante}
              >
                {dao.autoriteContractante}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Membres d'équipe
                </p>
                <p className="text-sm font-medium text-foreground">
                  {dao.equipe.filter((m) => m.role === "membre_equipe").length}{" "}
                  membre
                  {dao.equipe.filter((m) => m.role === "membre_equipe").length >
                  1
                    ? "s"
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  variant?: "total" | "active" | "completed" | "urgent" | "default";
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "total":
        return {
          cardClass: "bg-green-50/80 border-green-200/60 backdrop-blur-sm",
          titleClass: "text-green-700 font-medium text-sm",
          valueClass: "text-green-800",
          descriptionClass: "text-green-600/80 text-xs",
          iconClass:
            "h-7 w-7 bg-green-500 text-white rounded-lg p-1.5 shadow-sm",
        };
      case "active":
        return {
          cardClass: "bg-orange-50/80 border-orange-200/60 backdrop-blur-sm",
          titleClass: "text-orange-700 font-medium text-sm",
          valueClass: "text-orange-800",
          descriptionClass: "text-orange-600/80 text-xs",
          iconClass:
            "h-7 w-7 bg-orange-500 text-white rounded-lg p-1.5 shadow-sm",
        };
      case "completed":
        return {
          cardClass: "bg-gray-50/80 border-gray-200/60 backdrop-blur-sm",
          titleClass: "text-gray-700 font-medium text-sm",
          valueClass: "text-gray-800",
          descriptionClass: "text-gray-600/80 text-xs",
          iconClass:
            "h-7 w-7 bg-gray-500 text-white rounded-lg p-1.5 shadow-sm",
        };
      case "urgent":
        return {
          cardClass: "bg-red-50/80 border-red-200/60 backdrop-blur-sm",
          titleClass: "text-red-700 font-medium text-sm",
          valueClass: "text-red-800",
          descriptionClass: "text-red-600/80 text-xs",
          iconClass: "h-7 w-7 bg-red-500 text-white rounded-lg p-1.5 shadow-sm",
        };
      default:
        return {
          cardClass: "",
          titleClass: "text-sm font-medium",
          valueClass: "text-2xl font-bold",
          descriptionClass: "text-xs text-muted-foreground",
          iconClass: "h-4 w-4 text-muted-foreground",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-200 border-0 shadow-sm hover:-translate-y-0.5",
        styles.cardClass,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
        <CardTitle className={cn("text-xs sm:text-sm", styles.titleClass)}>
          {title}
        </CardTitle>
        <Icon
          className={cn(
            "h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7",
            styles.iconClass.replace("h-7 w-7", ""),
            variant === "urgent" ? "blink-attention" : "",
          )}
        />
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div
          className={cn(
            "text-xl sm:text-2xl font-bold mb-0.5",
            styles.valueClass,
          )}
        >
          {value}
        </div>
        <p className={cn("text-xs", styles.descriptionClass)}>{description}</p>
      </CardContent>
    </Card>
  );
}

export default function Index() {
  const [searchTerm, setSearchTerm] = useState("");
  const [daos, setDaos] = useState<Dao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DaoFilters>({});
  const { user, isAdmin } = useAuth();

  // Load DAOs from API
  useEffect(() => {
    const loadDaos = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedDaos = await apiService.getAllDaos();
        setDaos(fetchedDaos);

        // Run calculation tests in development
        if (process.env.NODE_ENV === "development") {
          testProgressCalculations();
          testGlobalStatistics();
        }
      } catch (err) {
        console.error("Error loading DAOs:", err);
        setError("Failed to load DAOs");
      } finally {
        setLoading(false);
      }
    };

    loadDaos();
  }, []);

  // Development testing hook (Ctrl+Shift+T)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "T") {
        console.clear();
        console.log("��� Exécution des tests de fonctionnalité...\n");
        runAllTests();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle creating new DAO
  const handleCreateDao = async (
    newDaoData: Omit<Dao, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const createdDao = await apiService.createDao(newDaoData);
      setDaos((prev) => [createdDao, ...prev]);
    } catch (err) {
      console.error("Error creating DAO:", err);
      setError("Failed to create DAO");
    }
  };

  const filteredDaos = useMemo(() => {
    let filtered = daos;

    // Apply search term filter with comprehensive search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((dao) => {
        const searchableFields = [
          dao.numeroListe,
          dao.objetDossier,
          dao.reference,
          dao.autoriteContractante,
          ...dao.equipe.map((member) => member.name),
        ];

        return searchableFields.some(
          (field) => field && field.toLowerCase().includes(searchLower),
        );
      });
    }

    // Apply filters
    if (filters.dateRange?.start && filters.dateRange?.end) {
      filtered = filtered.filter((dao) => {
        const daoDate = new Date(dao.dateDepot);
        const startDate = new Date(filters.dateRange!.start);
        const endDate = new Date(filters.dateRange!.end);
        return daoDate >= startDate && daoDate <= endDate;
      });
    }

    if (filters.autoriteContractante) {
      filtered = filtered.filter(
        (dao) => dao.autoriteContractante === filters.autoriteContractante,
      );
    }

    if (filters.statut) {
      filtered = filtered.filter((dao) => {
        const progress = calculateDaoProgress(dao.tasks);
        const status = calculateDaoStatus(dao.dateDepot, progress);

        switch (filters.statut) {
          case "en_cours":
            return progress < 100;
          case "termine":
            return progress >= 100;
          case "a_risque":
            return status === "urgent";
          default:
            return true;
        }
      });
    }

    if (filters.equipe) {
      filtered = filtered.filter((dao) =>
        dao.equipe.some((member) => member.name === filters.equipe),
      );
    }

    return filtered;
  }, [searchTerm, daos, filters]);

  const stats = useMemo(() => {
    const activeDaos = daos.filter(
      (dao) => calculateDaoProgress(dao.tasks) < 100,
    );
    const completedDaos = daos.filter(
      (dao) => calculateDaoProgress(dao.tasks) >= 100,
    );
    const urgentDaos = daos.filter((dao) => {
      const status = calculateDaoStatus(
        dao.dateDepot,
        calculateDaoProgress(dao.tasks),
      );
      return status === "urgent";
    });

    const globalProgress =
      activeDaos.length > 0
        ? Math.round(
            activeDaos.reduce(
              (sum, dao) => sum + calculateDaoProgress(dao.tasks),
              0,
            ) / activeDaos.length,
          )
        : 0;

    return {
      total: daos.length,
      active: activeDaos.length,
      completed: completedDaos.length,
      urgent: urgentDaos.length,
      globalProgress,
    };
  }, [daos]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard
            title="Total DAO"
            value={stats.total}
            description="Dossiers dans la plateforme"
            icon={Calendar}
            variant="total"
          />
          <StatsCard
            title="En cours"
            value={stats.active}
            description="Dossiers actifs"
            icon={Clock}
            variant="active"
          />
          <StatsCard
            title="Terminés"
            value={stats.completed}
            description="Dossiers finalisés"
            icon={CheckCircle2}
            variant="completed"
          />
          <StatsCard
            title="À risque"
            value={stats.urgent}
            description="Échéance ≤ 3 jours"
            icon={AlertTriangle}
            variant="urgent"
          />
        </div>

        {/* Global Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progression Globale des DAO
            </CardTitle>
            <CardDescription>
              Taux moyen d'avancement de l'ensemble des DAO en cours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {stats.globalProgress}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {stats.active} dossier{stats.active > 1 ? "s" : ""} en cours
                </span>
              </div>
              <Progress
                value={stats.globalProgress}
                className={cn(
                  "h-3",
                  stats.globalProgress === 100 ? "[&>*]:bg-gray-400" : "",
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search and Actions */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">
              Rechercher DAO
            </CardTitle>
            <CardDescription className="text-sm">
              Recherchez et filtrez vos dossiers d'appel d'offres
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro, objet, référence ou autorité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <div className="flex flex-col xs:flex-row md:flex-row items-stretch xs:items-center md:items-center gap-2 xs:gap-3 md:flex-shrink-0">
                <div className="flex-1 xs:flex-none md:flex-none">
                  <FilterDialog
                    filters={filters}
                    onFiltersChange={setFilters}
                    availableAuthorities={[
                      ...new Set(daos.map((dao) => dao.autoriteContractante)),
                    ]}
                    availableTeamMembers={[
                      ...new Set(
                        daos.flatMap((dao) =>
                          dao.equipe.map((member) => member.name),
                        ),
                      ),
                    ]}
                  />
                </div>
                {user && isAdmin() && (
                  <div className="flex-1 xs:flex-none lg:flex-none">
                    <NewDaoDialog
                      existingDaos={daos}
                      onCreateDao={handleCreateDao}
                    />
                  </div>
                )}
              </div>
            </div>
            {(searchTerm ||
              filters.dateRange ||
              filters.autoriteContractante ||
              filters.statut) && (
              <div className="mt-3 sm:mt-4 space-y-2">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Filtres actifs:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {searchTerm && (
                    <Badge
                      variant="secondary"
                      className="text-xs max-w-[200px]"
                    >
                      <span className="truncate">
                        Recherche: "{searchTerm}"
                      </span>
                    </Badge>
                  )}
                  {filters.autoriteContractante && (
                    <Badge
                      variant="secondary"
                      className="text-xs max-w-[150px]"
                    >
                      <span className="truncate">
                        Autorité: {filters.autoriteContractante}
                      </span>
                    </Badge>
                  )}
                  {filters.statut && (
                    <Badge variant="secondary" className="text-xs">
                      Statut: {filters.statut}
                    </Badge>
                  )}
                  {filters.dateRange && (
                    <Badge variant="secondary" className="text-xs">
                      Période sélectionnée
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFilters({});
                    }}
                    className="h-6 text-xs px-2 py-1"
                  >
                    Effacer tout
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DAO List */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold">
              Dossiers d'Appel d'Offres
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {loading
                ? "Chargement..."
                : `${filteredDaos.length} dossier${filteredDaos.length > 1 ? "s" : ""}`}
            </span>
          </div>

          {error && (
            <Card className="p-6 text-center">
              <div className="text-red-600 mb-2">❌ Erreur</div>
              <p className="text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
            </Card>
          )}

          {/* Conteneur avec scroll pour éviter la pagination */}
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3 sm:space-y-4">
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 sm:p-6 animate-pulse">
                    <div className="h-5 sm:h-6 bg-gray-200 rounded mb-3 sm:mb-4"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                  </Card>
                ))}
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {filteredDaos.length > 0 ? (
                  filteredDaos.map((dao) => <DaoCard key={dao.id} dao={dao} />)
                ) : (
                  <Card className="col-span-full p-6 text-center">
                    <div className="text-muted-foreground">
                      Aucun DAO trouvé
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
