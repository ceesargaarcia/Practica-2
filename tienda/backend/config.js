const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
    port: process.env.PORT ,
    mongoUri: process.env.MONGODB_URI ,
    jwtSecret: process.env.JWT_SECRET ,
    jwtExpire: process.env.JWT_EXPIRE 
};