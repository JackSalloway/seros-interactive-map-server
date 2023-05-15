const express = require("express");
const router = express.Router();
const CombatInstanceController = require("../controllers/combatInstanceController");

// GET request all combat instance data
router.get("/combat_instance_data", async (req, res) => {
    console.log("combat_instance_data hit");
    try {
        const controller = new CombatInstanceController();
        const result = await controller.combatInstanceData(
            req.query.campaign_id
        );
        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

router.post("/create_combat_instance", async (req, res) => {
    console.log("create_combat_instance hit");
    // Add data validation and sanitization here later
    try {
        // Date value used for time of request
        const date = new Date();

        const combatInstanceData = {
            combat_details: req.body.instance_details,
            name: req.body.instance_name,
            description: req.body.instance_desc,
            campaign: req.body.instance_campaign_id,
            associated_location: req.body.instance_location_id,
            created_at: date,
        };

        // THINGS TO DO

        // Validate and sanitize the date before the try catch clauses

        // Check if player_character key:value pair is present within req.body.instance_details
        // If it is present and is false, continue as normal,
        // If it is present and is true, the campaign needs to be updated to include a new player character within the players array

        // Update the changelog to include a new combat instance creation

        // Return {instanceResult, changelogResult} and apply the returned data to the front end logic

        const controller = new CombatInstanceController();
        const instanceResult = await controller.createCombatInstance(
            combatInstanceData
        );
        return instanceResult;
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

module.exports = router;
