const database = require("../services/database");
const {
    selectQuery,
    insertStatement,
    deleteStatement,
} = require("../helpers/queries");

const combatInstanceColumns = [
    "id",
    "name",
    "description",
    "location_id",
    "updated_at",
];
class CombatInstanceController {
    // Fetch combat instance data when a campaign is selected
    async combatInstanceData(campaignId) {
        try {
            const combatInstanceQuery = `SELECT ?? AS ??, ??, ??,
            ??, ?? AS ??, ??, ??, ??, ??
            FROM ??
            JOIN ?? ON ?? = ??
            WHERE ?? = ?`;

            const combatInstanceParams = [
                "combat_instance.id",
                "combat_instance_id",
                "combat_instance.name",
                "combat_instance.description",
                "location_id",
                "location.name",
                "location_name",
                "latitude",
                "longitude",
                "combat_instance.updated_at",
                "campaign_id",
                "combat_instance",
                "location",
                "location.id",
                "combat_instance.location_id",
                "campaign_id",
                campaignId,
            ];

            const [combatInstances, _combatInstanceField] =
                await database.query(combatInstanceQuery, combatInstanceParams);

            const combatInstanceTurnsQuery = `SELECT ?? AS ??, ??, ??, ??,
            ??, ?? AS ??, ?? AS ??, ??, ?? AS ??, ??
            FROM ??
            JOIN ?? ON ?? = ??
            JOIN ?? ON ?? = ??
            WHERE ?? = ?`;

            const combatInstanceTurnsParams = [
                "combat_instance_player_turn.id",
                "player_turn_id",
                "turn_number",
                "damage",
                "healing",
                "player_id",
                "player.name",
                "player_name",
                "player.class",
                "player_class",
                "combat_instance_id",
                "campaign.id",
                "campaign_id",
                "combat_instance_player_turn.updated_at",
                "combat_instance_player_turn",
                "player",
                "player.id",
                "combat_instance_player_turn.player_id",
                "campaign",
                "campaign.id",
                "player.campaign_id",
                "campaign_id",
                campaignId,
            ];

            const [combatInstanceTurns, _combatInstanceTurnField] =
                await database.query(
                    combatInstanceTurnsQuery,
                    combatInstanceTurnsParams
                );

            const instanceData = combatInstances.map((instance) => {
                // Create instance object
                let instanceObject = {
                    id: instance.combat_instance_id,
                    name: instance.name,
                    description: instance.description,
                    updated_at: instance.updated_at,
                    location: {
                        id: instance.location_id,
                        name: instance.location_name,
                        latlng: {
                            lat: instance.latitude,
                            lng: instance.longitude,
                        },
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
                            updated_at: playerTurn.updated_at,
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
                                    updated_at: playerTurn.updated_at,
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
            const insertCombatInstanceColumns = [
                "name",
                "description",
                "location_id",
            ];

            const combatInstanceValues = [
                data.name,
                data.description,
                data.location_id,
            ];

            // Insert new combat instance into the database
            const [newCombatInstance] = await insertStatement(
                "combat_instance",
                insertCombatInstanceColumns,
                combatInstanceValues
            );

            // Select only the new combat instance from the database
            const [combatInstance, _combatInstanceField] = await selectQuery(
                "combat_instance",
                combatInstanceColumns,
                "id",
                newCombatInstance.insertId
            );

            return combatInstance;
        } catch (err) {
            throw err;
        }
    }

    async deleteCombatInstance(combatInstanceId) {
        try {
            // Create delete statement
            // because on delete cascade is enabled, only the relevant combat instance has to be deleted.
            await deleteStatement("combat_instance", "id", combatInstanceId);
            return;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = CombatInstanceController;
