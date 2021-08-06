const http = require('http');

class HttpError extends Error {
    constructor(status, message) {
        super(message || http.STATUS_CODES[status] || 'Some HttpError');
        this.name = 'HttpError';
        this.status = status;
    }
}

exports.HttpError = HttpError;