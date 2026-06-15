const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

router.get('/', campaignController.getCampaigns);
router.post('/', campaignController.createCampaign);
router.post('/dry-run', campaignController.dryRunSegment);
router.get('/:id', campaignController.getCampaignById);
router.post('/callback', campaignController.handleCallback);

module.exports = router;
