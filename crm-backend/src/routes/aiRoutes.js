const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/strategist', aiController.runStrategist);
router.get('/insights', aiController.getInsights);

module.exports = router;
