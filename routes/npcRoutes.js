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
    const importance = req.body.npc_quests.length === 0 ? false : true;

    const npcContent = {
        name: req.body.npc_name,
        race: req.body.npc_race,
        desc: req.body.npc_desc,
        disposition: req.body.npc_disposition,
        status: req.body.npc_status,
        important: importance,
        associated_locations: req.body.npc_associated_locations,
        quests: req.body.npc_quests,
        campaign: req.body.npc_campaign,
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
        const result = await controller.deleteNPC(req.body.data_id);
        return res.send(result);
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
        let importance = null;
        if (req.body.npc_quests.length === 0) {
            importance = false;
        } else {
            importance = true;
        }
        const updatedNPCContent = {
            name: req.body.npc_name,
            race: req.body.npc_race,
            desc: req.body.npc_desc,
            disposition: req.body.npc_disposition,
            status: req.body.npc_status,
            important: importance,
            associated_locations: req.body.npc_associated_locations,
            quests: req.body.npc_quests,
            campaign: req.body.npc_campaign,
        };
        const controller = new NPCController();
        const result = await controller.updateNPC(
            req.body.npc_id,
            updatedNPCContent
        );
        return res.send(result);
    } catch (err) {
        console.err(err);
        res.sendStatus(500);
    }
});

module.exports = router;
