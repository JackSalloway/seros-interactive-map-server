const database = require("../services/database");

class PlayerController {
    // Add a new player to a specific campaign
    async addNewPlayer(player, campaignId) {
        try {
            // Convert BOOLEAN to number to satisfy TINYINT data type in the SQL schema
            const isRealBoolean = player.isReal === "true" ? 1 : 0;

            const newPlayerStatement = `INSERT INTO player
            (name, class, is_real, campaign_id)
            VALUES ('${player.name}', '${player.class}', ${isRealBoolean}, ${campaignId})`;
            const [newPlayer] = await database.execute(newPlayerStatement);
            return newPlayer.insertId;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = PlayerController;
