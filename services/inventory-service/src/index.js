const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { StockItem, ConsumptionLog } = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.INVENTORY_PORT || 5007;
const MONGODB_URI = process.env.MONGODB_INVENTORY_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_inventory';

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// Initial fallback inventory stock
let fallbackStockItems = [
  {
    id: 'inv_1',
    name: 'Botanical Hair Toner',
    category: 'Hair Color & Chemistry',
    quantity: 2400,
    unit: 'ml',
    minThreshold: 500,
    unitCost: 0.12,
    location: 'Color Bar Shelf A'
  },
  {
    id: 'inv_2',
    name: 'Keratin Smoothing Solution',
    category: 'Hair Treatments',
    quantity: 1800,
    unit: 'ml',
    minThreshold: 300,
    unitCost: 0.25,
    location: 'Color Bar Shelf B'
  },
  {
    id: 'inv_3',
    name: 'Organic Argan Scalp Oil',
    category: 'Hair Treatments',
    quantity: 1200,
    unit: 'ml',
    minThreshold: 200,
    unitCost: 0.18,
    location: 'Spa Room Cabinet 1'
  },
  {
    id: 'inv_4',
    name: 'Deluxe Collagen Facial Mask',
    category: 'Skincare',
    quantity: 42,
    unit: 'units',
    minThreshold: 10,
    unitCost: 4.50,
    location: 'Facial Suite Cooler'
  },
  {
    id: 'inv_5',
    name: 'Vegan Gel Polish Base Coat',
    category: 'Nails',
    quantity: 35,
    unit: 'bottles',
    minThreshold: 8,
    unitCost: 8.00,
    location: 'Nail Station Station 3'
  },
  {
    id: 'inv_6',
    name: 'Bleach Powder & Developer',
    category: 'Hair Color & Chemistry',
    quantity: 3800,
    unit: 'g',
    minThreshold: 800,
    unitCost: 0.05,
    location: 'Color Bar Dispenser'
  }
];

// Audit log of consumables deducted during treatment completion
const fallbackConsumptionLogs = [
  {
    id: 'log_1001',
    appointmentId: 'apt_sample_1',
    stylistName: 'Sarah Jenkins',
    customerName: 'Alice Walker',
    serviceName: 'Classic Haircut & Styling',
    items: [
      { itemId: 'inv_3', name: 'Organic Argan Scalp Oil', amountUsed: 15, unit: 'ml', cost: 2.70 }
    ],
    totalCost: 2.70,
    timestamp: new Date(Date.now() - 86400000).toISOString()
  }
];

// Dedicated Database-per-Service Connection: salon_inventory
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    isMongoConnected = true;
    console.log('[Inventory Service] Connected to dedicated MongoDB database (salon_inventory).');
    const count = await StockItem.countDocuments();
    if (count === 0) {
      await StockItem.insertMany(fallbackStockItems);
      console.log('[Inventory Service] Seeded initial stock into salon_inventory database.');
    }
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn(`[Inventory Service] MongoDB not reachable (${err.message}). Using local in-memory dataset.`);
  });

// Health check
app.get('/api/inventory/health', (req, res) => {
  res.json({
    service: 'inventory-service',
    status: 'healthy',
    database: isMongoConnected ? 'mongodb:salon_inventory' : 'in-memory-fallback',
    timestamp: new Date().toISOString()
  });
});

// List all central inventory stock
app.get('/api/inventory', async (req, res) => {
  try {
    let items = fallbackStockItems;
    if (isMongoConnected) {
      items = await StockItem.find().lean();
    }

    const lowStock = items.filter(item => item.quantity <= item.minThreshold);
    const totalValuation = items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

    res.json({
      count: items.length,
      stock: items,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock,
      totalValuation: parseFloat(totalValuation.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log consumables and deduct stock upon service completion (Scenario 05)
app.post('/api/inventory/consume', async (req, res) => {
  const { appointmentId, stylistName, customerName, serviceName, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Array of consumed items is required' });
  }

  try {
    let totalCost = 0;
    const processedItems = [];

    if (isMongoConnected) {
      for (const logItem of items) {
        const stock = await StockItem.findOne({
          $or: [
            { id: logItem.itemId },
            { name: new RegExp(`^${logItem.name || ''}$`, 'i') }
          ]
        });

        if (stock) {
          const deduction = Number(logItem.amountUsed) || 0;
          stock.quantity = Math.max(0, stock.quantity - deduction);
          const itemCost = parseFloat((deduction * stock.unitCost).toFixed(2));
          totalCost += itemCost;
          await stock.save();

          processedItems.push({
            itemId: stock.id,
            name: stock.name,
            amountUsed: deduction,
            unit: stock.unit,
            remainingStock: stock.quantity,
            cost: itemCost
          });
        }
      }

      const logEntry = {
        id: `log_${Date.now()}`,
        appointmentId: appointmentId || `apt_${Date.now()}`,
        stylistName: stylistName || 'Stylist',
        customerName: customerName || 'Client',
        serviceName: serviceName || 'Treatment',
        items: processedItems,
        totalCost: parseFloat(totalCost.toFixed(2)),
        timestamp: new Date().toISOString()
      };

      const createdLog = await ConsumptionLog.create(logEntry);
      console.log(`[Inventory Service] Logged ${processedItems.length} consumables to DB. Total: $${totalCost}`);

      return res.status(201).json({
        message: 'Consumables deducted and logged successfully in salon_inventory DB',
        log: createdLog
      });
    }

    // In-memory fallback
    for (const logItem of items) {
      const stock = fallbackStockItems.find(s => s.id === logItem.itemId || s.name.toLowerCase() === (logItem.name || '').toLowerCase());
      if (stock) {
        const deduction = Number(logItem.amountUsed) || 0;
        stock.quantity = Math.max(0, stock.quantity - deduction);
        const itemCost = parseFloat((deduction * stock.unitCost).toFixed(2));
        totalCost += itemCost;
        processedItems.push({
          itemId: stock.id,
          name: stock.name,
          amountUsed: deduction,
          unit: stock.unit,
          remainingStock: stock.quantity,
          cost: itemCost
        });
      }
    }

    const logEntry = {
      id: `log_${Date.now()}`,
      appointmentId: appointmentId || `apt_${Date.now()}`,
      stylistName: stylistName || 'Stylist',
      customerName: customerName || 'Client',
      serviceName: serviceName || 'Treatment',
      items: processedItems,
      totalCost: parseFloat(totalCost.toFixed(2)),
      timestamp: new Date().toISOString()
    };

    fallbackConsumptionLogs.unshift(logEntry);
    res.status(201).json({
      message: 'Consumables deducted and logged successfully',
      log: logEntry
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restock inventory
app.post('/api/inventory/restock', async (req, res) => {
  const { itemId, addedQuantity } = req.body;
  const added = Number(addedQuantity) || 0;

  try {
    if (isMongoConnected) {
      const target = await StockItem.findOne({ id: itemId });
      if (!target) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      target.quantity += added;
      await target.save();
      return res.json({
        message: `Restocked ${target.name} by +${added} ${target.unit}`,
        item: target
      });
    }

    const target = fallbackStockItems.find(s => s.id === itemId);
    if (!target) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    target.quantity += added;
    res.json({
      message: `Restocked ${target.name} by +${added} ${target.unit}`,
      item: target
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View consumption audit logs
app.get('/api/inventory/logs', async (req, res) => {
  try {
    if (isMongoConnected) {
      const logs = await ConsumptionLog.find().sort({ timestamp: -1 }).limit(50).lean();
      return res.json({
        count: logs.length,
        logs
      });
    }

    res.json({
      count: fallbackConsumptionLogs.length,
      logs: fallbackConsumptionLogs.slice(0, 50)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Inventory Service] Running on port ${PORT}`);
});
