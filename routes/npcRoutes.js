const express = require("express");
const router = express.Router();
const Validators = require("../helpers/validators");
const NPCController = require("../controllers/npcController");
const ChangelogController = require("../controllers/changelogController");

/// NPC ROUTES ///

/// GET request for all NPC data
router.get("/npc_data", async (req, res) => {
    console.log("npc_data hit");
    try {
        const controller = new NPCController();
        const result = await controller.npcData(req.query.campaign_id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// POST request to create a new friendly npc
router.post("/create_npc", ...Validators.npc(), async (req, res) => {
    console.log("create_npc hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }

    const npcContent = {
        name: req.body.npc_name,
        race: req.body.npc_race,
        description: req.body.npc_description,
        disposition: req.body.npc_disposition,
        status: req.body.npc_status,
        associated_locations: req.body.npc_associated_locations,
        associated_quests: req.body.npc_quests,
        campaignId: req.body.npc_campaign,
    };
    try {
        const controller = new NPCController();
        const npcResult = await controller.createNPC(npcContent);

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.npc_campaign,
            req.body.username,
            req.body.npc_name,
            req.url
        );

        res.json({ npcResult, changelogResult });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// DELETE request to delete a specific npc
router.delete("/delete_npc", async (req, res) => {
    console.log("delete_npc hit");
    try {
        const controller = new NPCController();
        const npcResult = await controller.deleteNPC(req.body.npc_id);

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.npc_name,
            req.url
        );

        return res.send({ npcResult, changelogResult });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// Post request to update a specific npc
router.post("/update_npc", ...Validators.npc(), async (req, res) => {
    console.log("update_npc hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }
    try {
        const updatedNPCContent = {
            name: req.body.npc_name,
            description: req.body.npc_description,
            race: req.body.npc_race,
            disposition: req.body.npc_disposition,
            status: req.body.npc_status,
            associated_locations: req.body.npc_associated_locations,
            quests: req.body.npc_quests,
        };

        const controller = new NPCController();
        const npcResult = await controller.updateNPC(
            req.body.npc_id,
            updatedNPCContent,
            req.body.campaign_id
        );

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.npc_name,
            req.url
        );

        return res.send({
            npcResult,
            changelogResult,
        });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// Post request to update a locationless NPC
router.post(
    "/locationless_npc",
    ...Validators.locationlessNPC(),
    async (req, res) => {
        console.log("locationless_npc hit");
        const errors = Validators.validateResult(req);
        if (errors !== undefined) {
            return res.status(400).json(errors);
        }
        try {
            const controller = new NPCController();
            const npcResult = await controller.updateLocationlessNPC(
                req.body.npc_id,
                req.body.npc_associated_locations
            );

            const changelogController = new ChangelogController();
            const changelogResult = await changelogController.updateChangelog(
                req.body.npc_campaign,
                req.body.username,
                req.body.npc_name,
                req.url
            );

            return res.send({ npcResult, changelogResult });
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    }
);

module.exports = router;
