const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.INVENTORY_PORT || 5007;

app.use(cors());
app.use(express.json());

// In-memory central inventory stock
let stockItems = [
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
const consumptionLogs = [
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

// Health check
app.get('/api/inventory/health', (req, res) => {
  res.json({
    service: 'inventory-service',
    status: 'healthy',
    itemCount: stockItems.length,
    timestamp: new Date().toISOString()
  });
});

// List all central inventory stock
app.get('/api/inventory', (req, res) => {
  const lowStock = stockItems.filter(item => item.quantity <= item.minThreshold);
  const totalValuation = stockItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

  res.json({
    count: stockItems.length,
    stock: stockItems,
    lowStockCount: lowStock.length,
    lowStockItems: lowStock,
    totalValuation: parseFloat(totalValuation.toFixed(2))
  });
});

// Log consumables and deduct stock upon service completion (Scenario 05)
app.post('/api/inventory/consume', (req, res) => {
  const { appointmentId, stylistName, customerName, serviceName, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Array of consumed items is required' });
  }

  let totalCost = 0;
  const processedItems = [];

  for (const logItem of items) {
    const stock = stockItems.find(s => s.id === logItem.itemId || s.name.toLowerCase() === (logItem.name || '').toLowerCase());
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

  consumptionLogs.unshift(logEntry);

  console.log(`[Inventory Service] Logged ${processedItems.length} consumables for appointment ${appointmentId}. Total cost: $${totalCost}`);

  res.status(201).json({
    message: 'Consumables deducted and logged successfully',
    log: logEntry
  });
});

// Restock inventory
app.post('/api/inventory/restock', (req, res) => {
  const { itemId, addedQuantity } = req.body;
  const target = stockItems.find(s => s.id === itemId);

  if (!target) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  const added = Number(addedQuantity) || 0;
  target.quantity += added;

  res.json({
    message: `Restocked ${target.name} by +${added} ${target.unit}`,
    item: target
  });
});

// View consumption audit logs
app.get('/api/inventory/logs', (req, res) => {
  res.json({
    count: consumptionLogs.length,
    logs: consumptionLogs.slice(0, 50)
  });
});

app.listen(PORT, () => {
  console.log(`[Inventory Service] Running on port ${PORT}`);
});
