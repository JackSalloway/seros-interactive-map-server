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
        };

        // console.log(campaignData);
        // console.log(req.body.username);
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

// GET request to fetch campaign settings
router.get("/campaign_settings", async (req, res) => {
    console.log("campaign settings hit");
    // console.log(req.query.campaign_id);
    try {
        const controller = new CampaignController();
        const { campaign, invite } = await controller.campaignSettings(
            req.query.campaign_id
        );
        console.log(campaign);
        console.log(invite);
        res.json({ campaign, invite });
    } catch (err) {
        console.err(err);
        res.sendstatus(500);
    }
});

router.put("/campaign_generate_code", async (req, res) => {
    console.log("campaign generate code hit");
    try {
        const controller = new CampaignController();
        console.log(req.body);
        const result = await controller.campaignCreateInviteCode(
            req.body.campaign_id
        );
        // console.log(result);
        res.send(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
