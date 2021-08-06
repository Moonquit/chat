const MongoStore = require('connect-mongo');
const config = require('../config');

module.exports = new MongoStore({
    mongoUrl: config.mongo.uri,
  })