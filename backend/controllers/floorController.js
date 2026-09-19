const Floor = require('../models/Floor');
const db = require('../config/database');

exports.getFloors = async (req, res, next) => {
    try {
        const floors = await Floor.findByStore(req.store.id);
        res.json({ success: true, data: floors });
    } catch (error) { next(error); }
};

exports.createFloor = async (req, res, next) => {
    try {
        const floor = await Floor.create({ store_id: req.store.id, ...req.body });
        res.status(201).json({ success: true, data: floor });
    } catch (error) { next(error); }
};

exports.getFloor = async (req, res, next) => {
    try {
        const ownership = await db.query('SELECT id FROM floors WHERE id = $1 AND store_id = $2', [req.params.id, req.params.storeId]);
        if (ownership.rows.length === 0) {
            return res.status(404).json({ error: 'Floor not found' });
        }
        const floor = await Floor.findFullFloor(req.params.id);
        if (!floor) return res.status(404).json({ error: 'Floor not found' });
        res.json({ success: true, data: floor });
    } catch (error) { next(error); }
};

exports.updateFloor = async (req, res, next) => {
    try {
        const floor = await Floor.update(req.params.id, req.params.storeId, req.body);
        if (!floor) {
            return res.status(404).json({ error: 'Floor not found' });
        }
        res.json({ success: true, data: floor });
    } catch (error) { next(error); }
};

exports.deleteFloor = async (req, res, next) => {
    try {
        const deleted = await Floor.delete(req.params.id, req.params.storeId);
        if (!deleted) {
            return res.status(404).json({ error: 'Floor not found' });
        }
        res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
};

exports.createLayout = async (req, res, next) => {
    try {
        const layout = await Floor.createLayout({ floor_id: req.params.floorId, ...req.body });
        res.status(201).json({ success: true, data: layout });
    } catch (error) { next(error); }
};

exports.updateLayout = async (req, res, next) => {
    try {
        const layout = await Floor.updateLayout(req.params.layoutId, req.params.storeId, req.body);
        if (!layout) {
            return res.status(404).json({ error: 'Layout not found' });
        }
        res.json({ success: true, data: layout });
    } catch (error) { next(error); }
};

exports.deleteLayout = async (req, res, next) => {
    try {
        const deleted = await Floor.deleteLayout(req.params.layoutId, req.params.storeId);
        if (!deleted) {
            return res.status(404).json({ error: 'Layout not found' });
        }
        res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
};

exports.createElement = async (req, res, next) => {
    try {
        const element = await Floor.createElement({ layout_id: req.params.layoutId, ...req.body });
        res.status(201).json({ success: true, data: element });
    } catch (error) { next(error); }
};

exports.updateElement = async (req, res, next) => {
    try {
        const element = await Floor.updateElement(req.params.elementId, req.params.storeId, req.body);
        if (!element) {
            return res.status(404).json({ error: 'Element not found' });
        }
        res.json({ success: true, data: element });
    } catch (error) { next(error); }
};

exports.deleteElement = async (req, res, next) => {
    try {
        const deleted = await Floor.deleteElement(req.params.elementId, req.params.storeId);
        if (!deleted) {
            return res.status(404).json({ error: 'Element not found' });
        }
        res.json({ success: true, data: { deleted: true } });
    } catch (error) { next(error); }
};

exports.saveLayout = async (req, res, next) => {
    try {
        const { layoutId } = req.params;
        const { elements } = req.body;

        const created = await Floor.saveLayout(layoutId, req.params.storeId, elements);
        if (!created) {
            return res.status(404).json({ error: 'Layout not found' });
        }

        res.json({ success: true, data: created });
    } catch (error) { next(error); }
};