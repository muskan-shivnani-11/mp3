export function parseJSONOrThrow(value, name) {
    if (value === undefined) return undefined;
    try {
    return JSON.parse(value);
    } catch (e) {
    const err = new Error(`Invalid JSON for parameter: ${name}`);
    err.status = 400;
    throw err;
    }
    }
    
    export function buildQuery(Model, { where, sort, select, skip, limit, count, defaultLimit }) {
    const w = where || {}; // object
    if (count === true || count === 'true') {
    return { exec: () => Model.countDocuments(w) };
    }
    
    let q = Model.find(w);
    if (sort) q = q.sort(sort);
    if (select) q = q.select(select);
    if (skip !== undefined) q = q.skip(Number(skip));
    
    if (limit !== undefined) {
    q = q.limit(Number(limit));
    } else if (defaultLimit !== undefined) {
    q = q.limit(defaultLimit);
    }
    return { exec: () => q.exec() };
    }