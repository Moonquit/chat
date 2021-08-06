const winston = require('winston');

const myFormat = winston.format.printf(({ level, message, label }) => {
    return `[${label}] ${level}: ${message}`;
});

module.exports = function(module) {
    let path = module.filename.split('\\').slice(-2).join('/');

    return winston.createLogger({
        level: (process.env.NODE_ENV === 'production') ? 'error' : 'debug',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.label({ label: path }),
            myFormat
        ),
        transports: [new winston.transports.Console()]
      });
    
}