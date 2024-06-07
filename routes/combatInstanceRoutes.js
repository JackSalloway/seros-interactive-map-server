const express = require("express");
const router = express.Router();
const CombatInstanceController = require("../controllers/combatInstanceController");
const PlayerController = require("../controllers/playerController");
const CombatInstancePlayerTurnController = require("../controllers/combatInstancePlayerTurnController");
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
                        req.body.campaign_id
                    );
                    player.id = newPlayerId;
                }
                return player;
            })
        );

        const combatInstanceData = {
            name: req.body.instance_name,
            description: req.body.instance_description,
            location_id: req.body.location_id,
        };

        // Create a new combat instance row and return it
        const combatInstanceController = new CombatInstanceController();
        const newCombatInstance =
            await combatInstanceController.createCombatInstance(
                combatInstanceData
            );

        // Create new rows in the combat_instance_player_turns table for each player and their turns
        const combatInstancePlayerTurnsController =
            new CombatInstancePlayerTurnController();

        const turns = playerDetails[0].turns.damage.length;

        const playerArray = await Promise.all(
            playerDetails.map(async (player) => {
                let playerStats = {
                    id: player.id,
                    name: player.name,
                    class: player.class,
                    is_real: player.isReal,
                    turns: [],
                };
                for (let i = 0; i < turns; i++) {
                    const newPlayerTurn =
                        await combatInstancePlayerTurnsController.addNewTurn(
                            i + 1,
                            player.turns.damage[i],
                            player.turns.healing[i],
                            player.id,
                            newCombatInstance.id
                        );
                    playerStats.turns.push(newPlayerTurn);
                }
                return playerStats;
            })
        );

        newCombatInstance.players = playerArray;
        newCombatInstance.location = {
            id: req.body.location_id,
            name: req.body.location_name,
            latlng: req.body.location_latlng,
        };
        newCombatInstance.campaign = {
            id: req.body.campaign_id,
        };

        // Select player values
        const campaignController = new CampaignController();
        const players = await campaignController.campaignPlayers(
            req.body.campaign_id
        );

        // Update the changelog to include a new combat instance creation
        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.instance_name,
            req.url
        );

        // Return {instanceResult, changelogResult} and apply the returned data to the front end logic
        return res.json({ newCombatInstance, players, changelogResult });
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

router.delete("/delete_combat_instance", async (req, res) => {
    console.log("delete_combat_instance hit");
    try {
        // Delete a single combat instance
        const controller = new CombatInstanceController();
        await controller.deleteCombatInstance(req.body.combat_instance_id);

        // Update changelog
        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.combat_instance_name,
            req.url
        );

        return res.send({ changelogResult });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.put("/update_combat_instance", async (req, res) => {
    console.log("update_combat_instance hit");
    try {
        // Add new players in player table if neccessary
        const playerDetails = await Promise.all(
            req.body.instance_details.map(async (player) => {
                // Check to see if the current player has an id value, if it doesnt then a new row will need to be made in the player table
                if (!player.id) {
                    const playerController = new PlayerController();
                    const newPlayerId = await playerController.addNewPlayer(
                        player,
                        req.body.campaign_id
                    );
                    player.id = newPlayerId;
                }
                return player;
            })
        );

        const updateCombatInstanceData = {
            name: req.body.instance_name,
            description: req.body.instance_description,
        };

        // Instantiate combat instance controller
        const combatInstanceController = new CombatInstanceController();
        await combatInstanceController.updateCombatInstance(
            req.body.instance_id,
            updateCombatInstanceData
        );

        // Instantiate combat instance turns controller
        const combatInstancePlayerTurnsController =
            new CombatInstancePlayerTurnController();

        // Loop over removed player turn ids array and remove each id present - removed player turns account for players that are actually removed from the instance
        req.body.removed_player_turn_ids.forEach(async (id) => {
            await combatInstancePlayerTurnsController.deleteTurn(id);
        });

        // Loop over playerDetails array
        playerDetails.forEach((player) => {
            console.log(player);

            // Loop over removed turns array and delete any elements that have an id value - some turns dont have ids as they could have been added and then removed for some reason
            player.removedTurns.forEach(async (turn) => {
                if (turn.id) {
                    await combatInstancePlayerTurnsController.deleteTurn(
                        turn.id
                    );
                }
            });

            // Loop over turns array
            player.turns.forEach(async (turn) => {
                // Update the relevant turn row if it has an id value, create a new turn row if it doesnt
                if (turn.id) {
                    await combatInstancePlayerTurnsController.updateTurn(turn);
                } else {
                    await combatInstancePlayerTurnsController.addNewTurn(
                        turn.turn_number,
                        turn.damage,
                        turn.healing,
                        player.id,
                        req.body.instance_id
                    );
                }
            });
        });

        // ASSEMBLE COMBAT INSTANCE OBJECT
        const combatInstanceResult = await combatInstanceController.assembleOne(
            req.body.instance_id
        );

        // Select player values
        const campaignController = new CampaignController();
        const players = await campaignController.campaignPlayers(
            req.body.campaign_id
        );

        // Update changelog
        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.instance_name,
            req.url
        );

        res.send({ combatInstanceResult, players, changelogResult });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
