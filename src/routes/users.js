import { Router } from 'express';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { ok, created, noContent, fail } from '../utils/response.js';
import { parseJSONOrThrow, buildQuery } from '../utils/query.js';
import { applyUserPendingTasks } from '../services/references.js';
import {  } from '../utils/response.js';


const router = Router();

// GET /api/users (supports where/sort/select/skip/limit/count)
router.get('/', async (req, res, next) => {
try {
const where = parseJSONOrThrow(req.query.where, 'where');
const sort = parseJSONOrThrow(req.query.sort, 'sort');
const select = parseJSONOrThrow(req.query.select, 'select');
const { skip, limit, count } = req.query;

const q = buildQuery(User, { where, sort, select, skip, limit, count });
const data = await q.exec();
return ok(res, data);
} catch (e) { next(e); }
});

// POST /api/users
router.post('/', async (req, res, next) => {
try {
const { name, email, pendingTasks = [] } = req.body || {};
if (!name || !email) return fail(res, 'name and email are required', null, 400);

const user = await User.create({ name, email, pendingTasks });
// If pendingTasks provided, mirror assignments
if (pendingTasks.length) {
await applyUserPendingTasks(user._id, pendingTasks);
}
return created(res, user);
} catch (e) { next(e); }
});

// GET /api/users/:id (supports select)
router.get('/:id', async (req, res, next) => {
try {
const select = parseJSONOrThrow(req.query.select, 'select');
const q = User.findById(req.params.id);
if (select) q.select(select);
const user = await q.exec();
if (!user) return fail(res, 'User not found', null, 404);
return ok(res, user);
} catch (e) { next(e); }
});

// PUT /api/users/:id (replace entire user)
router.put('/:id', async (req, res, next) => {
try {
const { name, email, pendingTasks = [] } = req.body || {};
if (!name || !email) return fail(res, 'name and email are required', null, 400);

const user = await User.findByIdAndUpdate(
req.params.id,
{ name, email, pendingTasks },
{ new: true, runValidators: true, overwrite: true }
);
if (!user) return fail(res, 'User not found', null, 404);

await applyUserPendingTasks(user._id, pendingTasks);
return ok(res, user);
} catch (e) { next(e); }
});

// DELETE /api/users/:id (unassign pending tasks)
router.delete('/:id', async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return fail(res, 'User not found', null, 404);
  
      await Task.updateMany(
        { assignedUser: String(user._id), completed: false },
        { $set: { assignedUser: '', assignedUserName: 'unassigned' } }
      );
  
      await user.deleteOne();
      return noContent(res); // 204
    } catch (e) {
      console.error('Error deleting user:', e);
      return fail(res, 'Failed to delete user', null, 500);
    }
  });  
  
  export default router;
  