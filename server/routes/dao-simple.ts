import express from "express";
import { serverMockDaos } from "../data/mockDaos";
import { authenticate, requireUser, requireAdmin } from "../middleware/auth";

const router = express.Router();

// In-memory storage for DAOs (fallback when MongoDB is not available)
let memoryStorage = [...serverMockDaos];

// Helper to generate new ID
function generateId(): string {
  return Date.now().toString();
}

// GET /api/dao - Get all DAOs (authenticated users only)
router.get("/", authenticate, (req, res) => {
  try {
    console.log(
      "📊 Serving DAOs from memory storage, count:",
      memoryStorage.length,
    );
    res.json(memoryStorage);
  } catch (error) {
    console.error("Error in GET /api/dao:", error);
    res.status(500).json({ error: "Failed to fetch DAOs" });
  }
});

// GET /api/dao/next-number - Get next DAO number (authenticated users only)
// IMPORTANT: This route must be BEFORE /:id route to avoid conflicts
router.get("/next-number", authenticate, (req, res) => {
  try {
    const year = new Date().getFullYear();

    // Filter DAOs for current year
    const currentYearDaos = memoryStorage.filter((dao) => {
      const match = dao.numeroListe.match(/DAO-(\d{4})-\d{3}/);
      return match && parseInt(match[1], 10) === year;
    });

    if (currentYearDaos.length === 0) {
      return res.json({ nextNumber: `DAO-${year}-001` });
    }

    // Extract numbers and find the highest
    const numbers = currentYearDaos
      .map((dao) => {
        const match = dao.numeroListe.match(/DAO-\d{4}-(\d{3})/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => !isNaN(num));

    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    const nextNumberString = `DAO-${year}-${nextNumber.toString().padStart(3, "0")}`;

    console.log("🔢 Generated next DAO number:", nextNumberString);
    res.json({ nextNumber: nextNumberString });
  } catch (error) {
    console.error("Error in GET /api/dao/next-number:", error);
    res.status(500).json({ error: "Failed to generate next DAO number" });
  }
});

// GET /api/dao/:id - Get DAO by ID (authenticated users only)
router.get("/:id", authenticate, (req, res) => {
  try {
    const dao = memoryStorage.find((d) => d.id === req.params.id);
    if (!dao) {
      return res.status(404).json({ error: "DAO not found" });
    }
    console.log("📄 Serving DAO by ID:", req.params.id);
    res.json(dao);
  } catch (error) {
    console.error("Error in GET /api/dao/:id:", error);
    res.status(500).json({ error: "Failed to fetch DAO" });
  }
});

// POST /api/dao - Create new DAO (admin only)
router.post("/", authenticate, requireAdmin, (req, res) => {
  try {
    const daoData = req.body;

    // Validate required fields
    if (
      !daoData.numeroListe ||
      !daoData.objetDossier ||
      !daoData.reference ||
      !daoData.autoriteContractante ||
      !daoData.dateDepot
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = generateId();
    const now = new Date().toISOString();
    const newDao = {
      ...daoData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    memoryStorage.unshift(newDao);
    console.log("✨ Created new DAO:", newDao.numeroListe);
    res.status(201).json(newDao);
  } catch (error) {
    console.error("Error in POST /api/dao:", error);
    res.status(500).json({ error: "Failed to create DAO" });
  }
});

// PUT /api/dao/:id - Update DAO (users and admins)
router.put("/:id", authenticate, requireUser, (req, res) => {
  try {
    const updates = req.body;
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
    console.log("📝 Updated DAO:", req.params.id);
    res.json(updatedDao);
  } catch (error) {
    console.error("Error in PUT /api/dao/:id:", error);
    res.status(500).json({ error: "Failed to update DAO" });
  }
});

// DELETE /api/dao/:id - Delete DAO (admin only)
router.delete("/:id", authenticate, requireAdmin, (req, res) => {
  try {
    const index = memoryStorage.findIndex((d) => d.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "DAO not found" });
    }

    memoryStorage.splice(index, 1);
    console.log("🗑️ Deleted DAO:", req.params.id);
    res.json({ message: "DAO deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/dao/:id:", error);
    res.status(500).json({ error: "Failed to delete DAO" });
  }
});

// GET /api/dao/next-number - Get next DAO number (authenticated users only)
router.get("/next-number", authenticate, (req, res) => {
  try {
    const year = new Date().getFullYear();

    // Filter DAOs for current year
    const currentYearDaos = memoryStorage.filter((dao) => {
      const match = dao.numeroListe.match(/DAO-(\d{4})-\d{3}/);
      return match && parseInt(match[1], 10) === year;
    });

    if (currentYearDaos.length === 0) {
      return res.json({ nextNumber: `DAO-${year}-001` });
    }

    // Extract numbers and find the highest
    const numbers = currentYearDaos
      .map((dao) => {
        const match = dao.numeroListe.match(/DAO-\d{4}-(\d{3})/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => !isNaN(num));

    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    const nextNumberString = `DAO-${year}-${nextNumber.toString().padStart(3, "0")}`;

    console.log("🔢 Generated next DAO number:", nextNumberString);
    res.json({ nextNumber: nextNumberString });
  } catch (error) {
    console.error("Error in GET /api/dao/next-number:", error);
    res.status(500).json({ error: "Failed to generate next DAO number" });
  }
});

export default router;
