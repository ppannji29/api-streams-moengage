require('dotenv').config();
const express = require('express');
// const request = require('request');
const models = require('../models');
const router = express.Router();
const MoengageController = require('../controllers/MoengageController');
const Sequelize = require('sequelize');
const dbConn = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    port: 3306,
    logging: false,
    dialectOptions: {
      requestTimeout: 30000,
      encrypt: true
    }
})

// -------------------------
// Start of Routes Endpoint
// -------------------------
// router.post('/create', function(req, res, next) {
//     res.send('API Streams POST');
// });
router.get('/', MoengageController.getAllMoengage);
router.get('/api/test', MoengageController.deviceCountEvents);
router.post('/store/streams', MoengageController.storeStreams);

// -------------------------
// End of Routes Endpoint
// -------------------------

module.exports = router;