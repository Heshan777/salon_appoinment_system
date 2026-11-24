const mongoose = require('mongoose');

const StockItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  minThreshold: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  location: { type: String }
}, { id: false });

const ConsumptionLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  appointmentId: { type: String, required: true, index: true },
  stylistName: { type: String, required: true },
  customerName: { type: String },
  serviceName: { type: String },
  items: [
    {
      itemId: String,
      name: String,
      amountUsed: Number,
      unit: String,
      cost: Number
    }
  ],
  totalCost: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, { id: false });

const StockItem = mongoose.model('StockItem', StockItemSchema, 'stock_items');
const ConsumptionLog = mongoose.model('ConsumptionLog', ConsumptionLogSchema, 'consumption_logs');

module.exports = { StockItem, ConsumptionLog };
