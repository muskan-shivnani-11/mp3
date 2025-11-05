import User from '../models/User.js';
import Task from '../models/Task.js';

export async function syncTaskAssignment(taskBefore, taskAfter) {
// Ensure pendingTasks and names remain consistent
const prevUserId = taskBefore?.assignedUser || '';
const nextUserId = taskAfter.assignedUser || '';
const taskId = String(taskAfter._id);

// If completed, remove from any user's pendingTasks
if (taskAfter.completed) {
if (nextUserId) {
await User.updateOne({ _id: nextUserId }, { $pull: { pendingTasks: taskId } });
}
return;
}

if (prevUserId && prevUserId !== nextUserId) {
await User.updateOne({ _id: prevUserId }, { $pull: { pendingTasks: taskId } });
}

if (nextUserId) {
const user = await User.findById(nextUserId).lean();
if (user) {
await User.updateOne({ _id: nextUserId }, { $addToSet: { pendingTasks: taskId } });
// also mirror assignedUserName
await Task.updateOne({ _id: taskId }, { assignedUserName: user.name });
} else {
// unassign if invalid user id provided
await Task.updateOne({ _id: taskId }, { assignedUser: '', assignedUserName: 'unassigned' });
}
} else {
// unassigned → ensure name matches
await Task.updateOne({ _id: taskId }, { assignedUserName: 'unassigned' });
}
}

export async function onTaskDelete(task) {
const userId = task.assignedUser;
if (userId) {
await User.updateOne({ _id: userId }, { $pull: { pendingTasks: String(task._id) } });
}
}

export async function applyUserPendingTasks(userId, newPendingIds) {
// newPendingIds: array of Task _id strings that should be pending & assigned to this user
const uid = String(userId);

// 1) Unassign tasks previously assigned to this user but not in new list
await Task.updateMany({ assignedUser: uid, completed: false, _id: { $nin: newPendingIds } }, {
$set: { assignedUser: '', assignedUserName: 'unassigned' }
});

// 2) Assign tasks in new list to this user (only if not completed)
const user = await User.findById(uid).lean();
if (!user) return;
await Task.updateMany({ _id: { $in: newPendingIds }, completed: false }, {
$set: { assignedUser: uid, assignedUserName: user.name }
});

// 3) Mirror pendingTasks array on user
await User.updateOne({ _id: uid }, { $set: { pendingTasks: newPendingIds } });
}