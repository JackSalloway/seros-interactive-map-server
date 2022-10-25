const express = require("express");
const router = express.Router();
const Validators = require("../helpers/validators");
const CampaignController = require("../controllers/campaignController");
const { setRefreshToken, setAccessToken } = require("../helpers/tokens");

/// CAMPAIGN ROUTES ///

// GET request for all relevant campaign data
// router.get("")

// POST request to create a new campaign and assign the relevant user as it's admin
router.post("/create_campaign", ...Validators.campaign(), async (req, res) => {
    console.log("create campaign hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }
    try {
        const campaignData = {
            name: req.body.campaign_name,
            desc: req.body.campaign_desc,
            invites: [],
        };

        console.log(campaignData);
        console.log(req.body.username);
        const controller = new CampaignController();
        const { accessToken, refreshToken, returnValue } =
            await controller.createCampaign(campaignData, req.body.username);
        setRefreshToken(res, refreshToken); // Set cookies
        setAccessToken(req, res, accessToken); // Send response
        console.log(returnValue);
        res.send(returnValue);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
