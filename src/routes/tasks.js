import { Router } from 'express';
import Task from '../models/Task.js';
import { ok, created, noContent, fail } from '../utils/response.js';
import { parseJSONOrThrow, buildQuery } from '../utils/query.js';
import { syncTaskAssignment, onTaskDelete } from '../services/references.js';

const router = Router();

// GET /api/tasks (supports where/sort/select/skip/limit/count)
router.get('/', async (req, res, next) => {
    try {
    const where = parseJSONOrThrow(req.query.where, 'where');
    const sort = parseJSONOrThrow(req.query.sort, 'sort');
    const select = parseJSONOrThrow(req.query.select, 'select');
    const { skip, limit, count } = req.query;
    
    const q = buildQuery(Task, { where, sort, select, skip, limit, count, defaultLimit: 100 });
    const data = await q.exec();
    return ok(res, data);
    } catch (e) { next(e); }
    });

// POST /api/tasks
router.post('/', async (req, res, next) => {
try {
const { name, deadline } = req.body || {};
if (!name || !deadline) return fail(res, 'name and deadline are required', null, 400);

const task = await Task.create({
name,
description: req.body.description ?? '',
deadline,
completed: req.body.completed ?? false,
assignedUser: req.body.assignedUser ?? '',
assignedUserName: req.body.assignedUserName ?? 'unassigned'
});

await syncTaskAssignment(null, task.toObject());
return created(res, task);
} catch (e) { next(e); }
});

// GET /api/tasks/:id (supports select)
router.get('/:id', async (req, res, next) => {
try {
const select = parseJSONOrThrow(req.query.select, 'select');
const q = Task.findById(req.params.id);
if (select) q.select(select);
const task = await q.exec();
if (!task) return fail(res, 'Task not found', null, 404);
return ok(res, task);
} catch (e) { next(e); }
});

// PUT /api/tasks/:id (replace entire task)
router.put('/:id', async (req, res, next) => {
try {
const { name, deadline } = req.body || {};
if (!name || !deadline) return fail(res, 'name and deadline are required', null, 400);

const before = await Task.findById(req.params.id).lean();
if (!before) return fail(res, 'Task not found', null, 404);

const after = await Task.findByIdAndUpdate(
req.params.id,
{
name,
description: req.body.description ?? '',
deadline,
completed: req.body.completed ?? false,
assignedUser: req.body.assignedUser ?? '',
assignedUserName: req.body.assignedUserName ?? 'unassigned'
},
{ new: true, runValidators: true, overwrite: true }
).lean();

await syncTaskAssignment(before, after);
return ok(res, after);
} catch (e) { next(e); }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
try {
const task = await Task.findById(req.params.id);
if (!task) return fail(res, 'Task not found', null, 404);

await onTaskDelete(task);
await task.deleteOne();
return noContent(res);
} catch (e) { next(e); }
});

export default router;