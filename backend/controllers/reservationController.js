const Reservation = require('../models/Reservation');

exports.getReservations = async (req, res, next) => {
    try {
        const { date, dateFrom, dateTo, status } = req.query;
        const reservations = await Reservation.findByStore(req.store.id, { date, dateFrom, dateTo, status });
        res.json({ success: true, data: reservations });
    } catch (error) { next(error); }
};

exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id, req.params.storeId);
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        res.json({ success: true, data: reservation });
    } catch (error) { next(error); }
};

exports.createReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.create({ store_id: req.store.id, ...req.body });
        res.status(201).json({ success: true, data: reservation });
    } catch (error) { next(error); }
};

exports.updateReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.update(req.params.id, req.params.storeId, req.body);
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        res.json({ success: true, data: reservation });
    } catch (error) { next(error); }
};

exports.deleteReservation = async (req, res, next) => {
    try {
        const deleted = await Reservation.delete(req.params.id, req.params.storeId);
        if (!deleted) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
};