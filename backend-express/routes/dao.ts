import express from "express";
import { DaoService } from "../services/daoService";
import { mockDaos } from "../../client/data/mockData";
import type { Dao } from "@shared/dao";

const router = express.Router();

// GET /api/dao - Get all DAOs
router.get("/", async (req, res) => {
  try {
    // Try MongoDB first
    try {
      await DaoService.initializeSampleData(mockDaos);
      const daos = await DaoService.getAllDaos();
      res.json(daos);
    } catch (dbError) {
      console.warn(
        "MongoDB not available, falling back to in-memory storage:",
        dbError.message,
      );
      // Fallback to in-memory storage
      res.json(memoryStorage);
    }
  } catch (error) {
    console.error("Error in GET /api/dao:", error);
    res.status(500).json({ error: "Failed to fetch DAOs" });
  }
});

// In-memory storage for fallback
let memoryStorage: Dao[] = [...mockDaos];

// Helper function to generate next DAO number for fallback
function generateNextDaoNumberFallback(existingDaos: Dao[]): string {
  const year = new Date().getFullYear();

  // Find existing DAO numbers for the current year
  const currentYearDaos = existingDaos.filter(
    (dao) => dao.numeroListe && dao.numeroListe.startsWith(`DAO-${year}-`),
  );

  if (currentYearDaos.length === 0) {
    return `DAO-${year}-001`;
  }

  // Extract numbers and find the highest
  const numbers = currentYearDaos
    .map((dao) => {
      const match = dao.numeroListe.match(/DAO-\d{4}-(\d{3})/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((num) => !isNaN(num));

  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `DAO-${year}-${nextNumber.toString().padStart(3, "0")}`;
}

// GET /api/dao/next-number - Get next DAO number
router.get("/next-number", async (req, res) => {
  try {
    try {
      const nextNumber = await DaoService.generateNextDaoNumber();
      res.json({ nextNumber });
    } catch (dbError) {
      console.warn(
        "MongoDB not available, using in-memory storage for next number",
      );
      const nextNumber = generateNextDaoNumberFallback(memoryStorage);
      res.json({ nextNumber });
    }
  } catch (error) {
    console.error("Error in GET /api/dao/next-number:", error);
    res.status(500).json({ error: "Failed to generate next DAO number" });
  }
});

// POST /api/dao - Create new DAO
router.post("/", async (req, res) => {
  try {
    const daoData = req.body;

    // Validate required fields
    if (
      !daoData.objetDossier ||
      !daoData.reference ||
      !daoData.autoriteContractante ||
      !daoData.dateDepot
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const newDao = await DaoService.createDao(daoData);
      res.status(201).json(newDao);
    } catch (dbError) {
      console.warn("MongoDB not available, using in-memory storage");
      // Fallback to in-memory storage
      const id = Date.now().toString();
      const now = new Date().toISOString();

      // Generate next DAO number if not provided or default
      let numeroListe = daoData.numeroListe;
      if (!numeroListe || numeroListe.includes("001")) {
        numeroListe = generateNextDaoNumberFallback(memoryStorage);
      }

      const newDao: Dao = {
        ...daoData,
        numeroListe,
        id,
        createdAt: now,
        updatedAt: now,
      };
      memoryStorage.unshift(newDao);
      res.status(201).json(newDao);
    }
  } catch (error) {
    console.error("Error in POST /api/dao:", error);
    res.status(500).json({ error: "Failed to create DAO" });
  }
});

// PUT /api/dao/:id - Update DAO
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;

    try {
      const updatedDao = await DaoService.updateDao(req.params.id, updates);
      if (!updatedDao) {
        return res.status(404).json({ error: "DAO not found" });
      }
      res.json(updatedDao);
    } catch (dbError) {
      console.warn("MongoDB not available, using in-memory storage for update");
      // Fallback to in-memory storage
      const index = memoryStorage.findIndex((d) => d.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "DAO not found" });
      }

      const updatedDao = {
        ...memoryStorage[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      memoryStorage[index] = updatedDao;
      res.json(updatedDao);
    }
  } catch (error) {
    console.error("Error in PUT /api/dao/:id:", error);
    res.status(500).json({ error: "Failed to update DAO" });
  }
});

// GET /api/dao/:id - Get DAO by ID
router.get("/:id", async (req, res) => {
  try {
    try {
      const dao = await DaoService.getDaoById(req.params.id);
      if (!dao) {
        return res.status(404).json({ error: "DAO not found" });
      }
      res.json(dao);
    } catch (dbError) {
      console.warn(
        "MongoDB not available, falling back to in-memory storage for ID lookup",
      );
      const dao = memoryStorage.find((d) => d.id === req.params.id);
      if (!dao) {
        return res.status(404).json({ error: "DAO not found" });
      }
      res.json(dao);
    }
  } catch (error) {
    console.error("Error in GET /api/dao/:id:", error);
    res.status(500).json({ error: "Failed to fetch DAO" });
  }
});

// DELETE /api/dao/:id - Delete DAO
router.delete("/:id", async (req, res) => {
  try {
    try {
      const deleted = await DaoService.deleteDao(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "DAO not found" });
      }
      res.json({ message: "DAO deleted successfully" });
    } catch (dbError) {
      console.warn("MongoDB not available, using in-memory storage for delete");
      // Fallback to in-memory storage
      const index = memoryStorage.findIndex((d) => d.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "DAO not found" });
      }

      memoryStorage.splice(index, 1);
      res.json({ message: "DAO deleted successfully" });
    }
  } catch (error) {
    console.error("Error in DELETE /api/dao/:id:", error);
    res.status(500).json({ error: "Failed to delete DAO" });
  }
});

export default router;
