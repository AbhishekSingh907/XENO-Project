const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.getCustomers);
router.get('/orders', customerController.getOrders);
router.post('/ingest', customerController.ingestData);

module.exports = router;
