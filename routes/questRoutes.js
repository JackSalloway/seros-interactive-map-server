const express = require("express");
const router = express.Router();
const Validators = require("../helpers/validators");
const QuestController = require("../controllers/questController");
const NPCController = require("../controllers/npcController");
const ChangelogController = require("../controllers/changelogController");

/// QUEST-ROUTES ///

// GET request for all quest data
router.get("/quest_data", async (req, res) => {
    console.log("quest_data hit");
    try {
        const controller = new QuestController();
        const result = await controller.questData(req.query.campaign_id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// POST request to create new quest
router.post("/create_quest", ...Validators.quest(), async (req, res) => {
    console.log("create_quest hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }
    try {
        const questContent = {
            name: req.body.quest_name,
            description: req.body.quest_description,
            completed: req.body.quest_completed,
            associated_locations: req.body.quest_associated_locations,
            campaignId: req.body.quest_campaign,
        };
        const controller = new QuestController();
        const questResult = await controller.createQuest(questContent);

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.quest_campaign,
            req.body.username,
            req.body.quest_name,
            req.url
        );

        res.json({ questResult, changelogResult });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// POST request to delete a quest and remove any instances where NPCs reference it
router.post("/delete_quest", async (req, res) => {
    console.log("delete_quest hit");
    try {
        // Delete a single quest
        const controller = new QuestController();
        await controller.deleteQuest(req.body.quest_id);

        // Select all npcs
        const npcController = new NPCController();
        const npcResult = await npcController.npcData(req.body.campaign_id);

        // Update Changelog
        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.quest_name,
            req.url
        );

        return res.json({ npcResult, changelogResult });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// POST request to update a quest
router.post("/update_quest", ...Validators.quest(), async (req, res) => {
    console.log("update_quest hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }
    try {
        const updatedQuestContent = {
            name: req.body.quest_name,
            description: req.body.quest_description,
            completed: req.body.quest_completed,
            associated_locations: req.body.quest_associated_locations,
        };

        // Update quest and return it
        const controller = new QuestController();
        const questResult = await controller.updateQuest(
            req.body.quest_id,
            updatedQuestContent,
            req.body.campaign_id
        );

        // Return all npcs for a specific campaign - doing this due to quest name values needing to be updated in npc objects
        const npcController = new NPCController();
        const npcResult = await npcController.npcData(req.body.campaign_id);

        // Add a new row to the changelog table
        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.quest_name,
            req.url
        );

        return res.json({
            questResult,
            npcResult,
            changelogResult,
        });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// Post request to update a locationless quest
router.post(
    "/locationless_quest",
    ...Validators.locationlessQuest(),
    async (req, res) => {
        console.log("locationless_quest hit");
        const errors = Validators.validateResult(req);
        if (errors !== undefined) {
            return res.status(400).json(errors);
        }
        try {
            const controller = new QuestController();
            const questResult = await controller.updateLocationlessQuest(
                req.body.quest_id,
                req.body.quest_associated_locations
            );

            const changelogController = new ChangelogController();
            const changelogResult = await changelogController.updateChangelog(
                req.body.quest_campaign,
                req.body.username,
                req.body.quest_name,
                req.url
            );

            return res.send({ questResult, changelogResult });
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    }
);

module.exports = router;
