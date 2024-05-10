const express = require("express");
const router = express.Router();
const CombatInstanceController = require("../controllers/combatInstanceController");
const PlayerController = require("../controllers/playerController");
const CombatInstancePlayerTurnController = require("../controllers/combatInstancePlayerTurnController");
// const CampaignController = require("../controllers/campaignController");
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
        const combatInstanceData = {
            name: req.body.instance_name,
            description: req.body.instance_description,
            location_id: req.body.instance_location_id,
        };

        // THINGS TO DO
        // Validate and sanitize the date before the try catch clauses

        // Add new players in player table if neccessary
        const playerDetails = await Promise.all(
            req.body.instance_details.map(async (player) => {
                // Check to see if the current player has an id value, if it doesnt then a new row will need to be made in the player table
                if (!player.id) {
                    const playerController = new PlayerController();
                    const newPlayerId = await playerController.addNewPlayer(
                        player,
                        req.body.instance_campaign_id
                    );
                    player.id = newPlayerId;
                }
                return player;
            })
        );

        const turns = playerDetails[0].turns.damage.length;

        // Create a new combat instance row and return it
        const combatInstanceController = new CombatInstanceController();
        const newCombatInstance =
            await combatInstanceController.createCombatInstance(
                combatInstanceData
            );

        // Create new rows in the combat_instance_player_turns table for each player and their turns
        const combatInstancePlayerTurnsController =
            new CombatInstancePlayerTurnController();

        let playerArray = [];

        playerDetails.forEach(async (player) => {
            let playerStats = {
                id: player.id,
                name: player.name,
                class: player.class,
                turns: [],
            };
            for (let i = 0; i < turns; i++) {
                const newPlayerTurn =
                    await combatInstancePlayerTurnsController.addNewTurn(
                        i,
                        player.turns.damage[i],
                        player.turns.healing[i],
                        player.id,
                        newCombatInstance.id
                    );
                playerStats.turns.push(newPlayerTurn);
            }
            playerArray.push(playerStats);
        });

        const test = playerDetails.map((player) => {});

        newCombatInstance.players = playerArray;
        newCombatInstance.location = {
            id: req.body.instance_location_id,
            name: req.body.instance_location_name,
            latlng: req.body.instance_location_latlng,
        };

        // Update the changelog to include a new combat instance creation
        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.instance_campaign_id,
            req.body.username,
            req.body.instance_name,
            req.url
        );

        // Return {instanceResult, changelogResult} and apply the returned data to the front end logic
        return res.json({ newCombatInstance, changelogResult });
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

module.exports = router;
