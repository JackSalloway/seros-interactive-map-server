const database = require("../services/database");
const {
    selectQuery,
    insertStatement,
    updateStatement,
    deleteStatement,
} = require("../helpers/queries");

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
        try {
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
            const [newTurnData, _combatInstancePlayerTurnField] =
                await selectQuery(
                    "combat_instance_player_turn",
                    defaultTurnQueryColumns,
                    "id",
                    newTurn.insertId
                );

            return newTurnData;
        } catch (err) {
            throw err;
        }
    }

    async updateTurn(turn) {
        try {
            const columnsPlusValues = {
                damage: turn.damage,
                healing: turn.healing,
            };

            // Create update statement
            await updateStatement(
                "combat_instance_player_turn",
                columnsPlusValues,
                "id",
                turn.id
            );

            // Select only the updated turn from the database
            const [updatedTurnData, _combatInstancePlayerTurnField] =
                await selectQuery(
                    "combat_instance_player_turn",
                    defaultTurnQueryColumns,
                    "id",
                    turn.id
                );

            return updatedTurnData;
        } catch (err) {
            throw err;
        }
    }

    async deleteTurn(turnId) {
        try {
            // Create delete statement
            await deleteStatement("combat_instance_player_turn", "id", turnId);
            return;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = CombatInstancePlayerTurnController;
