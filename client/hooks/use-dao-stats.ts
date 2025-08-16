import { useMemo } from "react";
import { Dao, calculateDaoProgress, calculateDaoStatus } from "@shared/dao";

interface DaoStats {
  total: number;
  active: number;
  completed: number;
  urgent: number;
  globalProgress: number;
}

export function useDaoStats(daos: Dao[]): DaoStats {
  return useMemo(() => {
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
}
