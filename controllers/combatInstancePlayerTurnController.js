const database = require("../services/database");
const { selectQuery, insertStatement } = require("../helpers/queries");

const defaultTurnQueryColumns = [
    "id",
    "turn_number",
    "damage",
    "healing",
    "player_id",
    "combat_instance_id",
];

class CombatInstancePlayerTurnController {
    // Add a new turn to the database
    async addNewTurn(turnNumber, damage, healing, playerId, combatInstanceId) {
        const insertTurnColumns = [
            "turn_number",
            "damage",
            "healing",
            "player_id",
            "combat_instance_id",
        ];

        const turnValues = [
            turnNumber,
            damage,
            healing,
            playerId,
            combatInstanceId,
        ];

        // Insert new combat instance into the database
        const [newTurn] = await insertStatement(
            "combat_instance_player_turn",
            insertTurnColumns,
            turnValues
        );

        // Select only the new turn from the database
        const [newTurnData, _combatInstancePlayerTurnField] = await selectQuery(
            "combat_instance_player_turn",
            defaultTurnQueryColumns,
            "id",
            newTurn.insertId
        );

        return newTurnData;
    }
}

module.exports = CombatInstancePlayerTurnController;
