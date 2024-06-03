const express = require("express");
const router = express.Router();
const Validators = require("../helpers/validators");
const CampaignController = require("../controllers/campaignController");
const { setRefreshToken, setAccessToken } = require("../helpers/tokens");

// Error imports
const UserAlreadyInCampaignError = require("../errors/campaignErrors/userAlreadyInCampaignError");
const InviteCodeDoesNotExistError = require("../errors/inviteErrors/inviteDoesNotExistError");

/// CAMPAIGN ROUTES ///

// GET request to fetch all relevant players for a specific campaign
router.get("/campaign_player_data", async (req, res) => {
    console.log("campain player data hit");
    try {
        // console.log(req.query);
        const controller = new CampaignController();
        const players = await controller.campaignPlayers(req.query.campaign_id);
        res.send(players);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

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
            description: req.body.campaign_description,
        };

        const userData = {
            username: req.body.username,
            id: req.body.user_id,
        };

        // Create a new campaign with the given data
        const controller = new CampaignController();
        const { accessToken, refreshToken, returnValue } =
            await controller.createCampaign(campaignData, userData);
        setRefreshToken(res, refreshToken); // Set cookies
        setAccessToken(req, res, accessToken); // Send response

        res.send(returnValue);
        // res.send({});
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// GET request to fetch campaign settings
router.get("/campaign_settings", async (req, res) => {
    console.log("campaign settings hit");
    try {
        const controller = new CampaignController();
        const { campaign, campaignInvite, campaignUsers } =
            await controller.campaignSettings(req.query.campaign_id);
        res.json({ campaign, campaignInvite, campaignUsers });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.put("/update_campaign", ...Validators.campaign(), async (req, res) => {
    console.log("update campaign hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }
    try {
        const controller = new CampaignController();
        const updatedData = {
            name: req.body.campaign_name,
            description: req.body.campaign_description,
        };
        const { accessToken, refreshToken, returnValue } =
            await controller.updateCampaign(
                req.body.campaign_id,
                updatedData,
                req.body.username
            );
        setRefreshToken(res, refreshToken); // Set cookies
        setAccessToken(req, res, accessToken); // Send response
        console.log(returnValue);

        res.send(returnValue);
        // res.send(null);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.put("/campaign_generate_code", async (req, res) => {
    console.log("campaign generate code hit");
    try {
        const controller = new CampaignController();
        const result = await controller.campaignCreateInviteCode(
            req.body.campaign_id
        );
        res.send(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/join_campaign", async (req, res) => {
    console.log("join campaign hit");
    try {
        const controller = new CampaignController();
        const { accessToken, refreshToken, returnValue } =
            await controller.joinCampaign(
                req.body.username,
                req.body.invite_code
            );
        setRefreshToken(res, refreshToken); // Set cookies
        setAccessToken(req, res, accessToken); // Send response
        res.send(returnValue);
    } catch (err) {
        console.error(err);
        if (err instanceof UserAlreadyInCampaignError) {
            res.status(400).send("You are already a member in this campaign.");
            return;
        }
        if (err instanceof InviteCodeDoesNotExistError) {
            res.status(400).send("Invite code invalid.");
            return;
        }
        res.sendStatus(500);
    }
});

// GET request to fetch all rows in major tables (locations, npcs, quests, instances) that reference a specific campaign id
router.get("/campaign_data_count", async (req, res) => {
    try {
        const controller = new CampaignController();
        const { locationCount, npcCount, questCount, instanceCount } =
            await controller.getDataCounts(req.query.campaign_id);
        res.send({ locationCount, npcCount, questCount, instanceCount });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// DELETE request to delete a specific campaign by id
router.delete("/delete_campaign", async (req, res) => {
    try {
        const controller = new CampaignController();

        const { accessToken, refreshToken, returnValue } =
            await controller.deleteCampaign(
                req.body.campaign_id,
                req.body.user
            );
        setRefreshToken(res, refreshToken); // Set cookies
        setAccessToken(req, res, accessToken); // Send response
        res.send(returnValue);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
