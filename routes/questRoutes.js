const express = require("express");
const router = express.Router();
const Validators = require("../helpers/validators");
const QuestController = require("../controllers/questController");
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
            desc: req.body.quest_desc,
            completed: req.body.quest_completed,
            associated_locations: req.body.quest_associated_locations,
            campaign: req.body.quest_campaign,
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
        const controller = new QuestController();
        const result = await controller.deleteQuest(req.body.data_id);
        return res.json(result);
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
            desc: req.body.quest_desc,
            completed: req.body.quest_completed,
            associated_locations: req.body.quest_associated_locations,
            campaign: req.body.quest_campaign,
        };
        const controller = new QuestController();
        const result = await controller.updateQuest(
            req.body.quest_id,
            updatedQuestContent
        );
        return res.json(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
