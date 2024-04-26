const database = require("../services/database");
// const mongoose = require("mongoose");
// const CombatInstance = require("../models/combat_instance");

class CombatInstanceController {
    // Fetch combat instance data when a campaign is selected
    async combatInstanceData(campaignId) {
        try {
            const combatInstanceQuery = `SELECT combat_instance.id AS 'combat_instance_id', combat_instance.name, combat_instance.description,
            location_id, location.name AS 'location_name', latitude AS 'location_latitude', longitude AS 'location_longitude', campaign_id
            FROM combat_instance JOIN location ON location.id = combat_instance.location_id
            WHERE campaign_id = '${campaignId}'`;
            const [combatInstances, _combatInstanceField] =
                await database.query(combatInstanceQuery);

            const combatInstanceTurnsQuery = `SELECT combat_instance_player_turn.id AS 'player_turn_id', turn_number, damage, healing, 
            player_id, player.name AS 'player_name', player.class AS 'player_class', combat_instance_id, campaign.id AS 'campaign_id'
            FROM tactical_journal.combat_instance_player_turn
            JOIN player ON player.id = combat_instance_player_turn.player_id
            JOIN campaign ON campaign.id = player.campaign_id
            WHERE campaign_id = '${campaignId}'`;
            const [combatInstanceTurns, _combatInstanceTurnField] =
                await database.query(combatInstanceTurnsQuery);

            const instanceData = combatInstances.map((instance) => {
                // Create instance object
                let instanceObject = {
                    id: instance.combat_instance_id,
                    name: instance.name,
                    description: instance.description,
                    location: {
                        id: instance.location_id,
                        name: instance.location_name,
                        latitude: instance.location_latitude,
                        longitude: instance.location_longitude,
                    },
                    campaign: {
                        id: instance.campaign_id,
                    },
                    players: [],
                };

                // Populate instanceObject.combat_details
                combatInstanceTurns.forEach((playerTurn) => {
                    // Early return if current turn in loop is not related to the combat instance
                    if (playerTurn.combat_instance_id !== instanceObject.id) {
                        return;
                    }

                    // Check if there is already an index for current player
                    const playerIndex = instanceObject.players.findIndex(
                        (player) => {
                            return player.id === playerTurn.player_id;
                        }
                    );

                    if (playerIndex !== -1) {
                        // Player index already exists, so push the player_turn_id, turn_number, damage and healing values into it
                        instanceObject.players[playerIndex].turns.push({
                            id: playerTurn.player_turn_id,
                            turn_number: playerTurn.turn_number,
                            damage: playerTurn.damage,
                            healing: playerTurn.healing,
                        });
                    } else {
                        // Player index does not exist yet, so create a new one with all relevant details
                        instanceObject.players.push({
                            id: playerTurn.player_id,
                            name: playerTurn.player_name,
                            class: playerTurn.player_class,
                            turns: [
                                {
                                    id: playerTurn.player_turn_id,
                                    turn_number: playerTurn.turn_number,
                                    damage: playerTurn.damage,
                                    healing: playerTurn.healing,
                                },
                            ],
                        });
                    }
                });
                return instanceObject;
            });

            return instanceData;
        } catch (err) {
            throw err;
        }
    }

    // Create a combat instance at a relevant location
    async createCombatInstance(data) {
        try {
            const combatInstance = new CombatInstance(data);
            await combatInstance.save();
            return CombatInstance.findOne({ _id: combatInstance.id })
                .populate("associated_location")
                .lean()
                .exec();
        } catch (err) {
            throw err;
        }
    }
}

module.exports = CombatInstanceController;
