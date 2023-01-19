const express = require("express");
const router = express.Router();
const ChangelogController = require("../controllers/changelogController");

// GET request for all map location data
router.get("/changelog_data", async (req, res) => {
    console.log("changelog_data hit");
    try {
        const controller = new ChangelogController();
        const result = await controller.changelogData(req.query.campaign_id);
        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

module.exports = router;
