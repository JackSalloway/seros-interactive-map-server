const express = require("express");
const router = express.Router();
const CombatInstanceController = require("../controllers/combatInstanceController");
const CampaignController = require("../controllers/campaignController");
const ChangelogController = require("../controllers/changelogController");

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

        // Create a new array of characters that are real players characters to add to the campaign document
        const checkForNewPlayerCharacters = req.body.instance_details
            .map((player) => {
                // return player.player_character; // Returns either undefined, true or false
                // console.log(player);
                if (player.player_character === true)
                    return {
                        name: player.player_name,
                        class: player.player_class,
                    };
            })
            .filter((player) => player !== undefined);

        // Add new player characters to the relevant campaign document
        if (checkForNewPlayerCharacters.length > 0) {
            const campaignController = new CampaignController();
            checkForNewPlayerCharacters.forEach((playerCharacter) => {
                campaignController.updateCampaignPlayers(
                    req.body.instance_campaign_id,
                    playerCharacter
                );
            });
        }

        // Update the changelog to include a new combat instance creation
        const controller = new CombatInstanceController();
        const instanceResult = await controller.createCombatInstance(
            combatInstanceData
        );
        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.instance_campaign_id,
            req.body.username,
            req.body.instance_name,
            req.url
        );

        // Return {instanceResult, changelogResult} and apply the returned data to the front end logic
        return res.json({ instanceResult, changelogResult });
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

module.exports = router;
