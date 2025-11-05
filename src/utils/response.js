export const ok = (res, data, message = 'OK') => {
    return res.json({ message, data });
    };
    
    export const created = (res, data, message = 'Created') => {
    return res.status(201).json({ message, data });
    };
    
    export const noContent = (res, message = 'No Content') => {
    return res.status(204).json({ message, data: null });
    };
    
    export const fail = (res, message = 'Bad Request', data = null, code) => {
    if (code) res.status(code);
    return res.json({ message, data });
    };