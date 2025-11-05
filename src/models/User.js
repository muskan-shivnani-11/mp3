import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
name: { type: String, required: [true, 'name is required'] },
email: { type: String, required: [true, 'email is required'], unique: true, index: true },
pendingTasks: { type: [String], default: [] }, // store Task _id strings
dateCreated: { type: Date, default: Date.now }
}, { versionKey: false });

export default mongoose.model('User', userSchema);