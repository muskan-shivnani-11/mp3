import { fail } from '../utils/response.js';

export const notFound = (req, res, next) => {
res.status(404);
return fail(res, 'Endpoint not found', null);
};

export const errorHandler = (err, req, res, next) => {
// Normalize Mongoose & JSON parse errors into human messages
const code = err.status || (err.name === 'ValidationError' ? 400 : 500);
let message = err.message || 'Server error';

if (err.name === 'MongoServerError' && err.code === 11000) {
message = 'Duplicate value for a unique field';
}
if (err.name === 'SyntaxError' && /JSON/.test(err.message)) {
message = 'Invalid JSON in request';
}

res.status(code);
return fail(res, message, null);
};