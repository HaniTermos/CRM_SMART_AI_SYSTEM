const KitchenTicket = require('../models/KitchenTicket');
const db = require('../config/database');

exports.getTickets = async (req, res, next) => {
  try {
    const { status } = req.query;
    const tickets = await KitchenTicket.findByStore(req.store.id, { status });
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};

exports.createTicket = async (req, res, next) => {
  try {
    const ticket = await KitchenTicket.create({ store_id: req.store.id, ...req.body });
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { storeId } = req.params;

    const ticket = await KitchenTicket.updateStatus(id, storeId, status);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (status === 'ready') {
      await db.query(`UPDATE orders SET status = 'shipped' WHERE id = $1 AND store_id = $2`, [ticket.order_id, storeId]);
    } else if (status === 'in_prep' || status === 'preparing') {
      await db.query(`UPDATE orders SET status = 'confirmed' WHERE id = $1 AND store_id = $2`, [ticket.order_id, storeId]);
    } else if (status === 'completed' || status === 'served') {
      await db.query(`UPDATE orders SET status = 'delivered' WHERE id = $1 AND store_id = $2`, [ticket.order_id, storeId]);
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

exports.deleteTicket = async (req, res, next) => {
  try {
    const deleted = await KitchenTicket.delete(req.params.id, req.params.storeId);
    if (!deleted) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};
