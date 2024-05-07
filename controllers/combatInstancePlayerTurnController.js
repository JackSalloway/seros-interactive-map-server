const database = require("../services/database");

class CombatInstancePlayerTurnController {
    // Add a new turn to the database
    async addNewTurn(turnNumber, damage, healing, playerId, combatInstanceId) {
        // Create a statement to add a new turn to the column
        const createTurnStatement = `INSERT INTO combat_instance_player_turn
        (turn_number, damage, healing, player_id, combat_instance_id)
        VALUES (${turnNumber}, ${damage}, ${healing}, ${playerId}, ${combatInstanceId})`;
        const [newTurn] = await database.execute(createTurnStatement);

        // Query and return the new turn value
        const turnQuery = `SELECT id, turn_number, damage, healing, player_id, combat_instance_id
        FROM combat_instance_player_turn
        WHERE id = ${newTurn.insertId}`;
        const [turn, _turnField] = await database.execute(turnQuery);

        return turn[0];
    }
}

module.exports = CombatInstancePlayerTurnController;
