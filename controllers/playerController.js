const database = require("../services/database");
const { insertStatement } = require("../helpers/queries");

class PlayerController {
    // Add a new player to a specific campaign
    async addNewPlayer(player, campaignId) {
        try {
            // Convert BOOLEAN to number to satisfy TINYINT data type in the SQL schema
            const isRealBoolean = player.isReal === true ? 1 : 0;

            const insertPlayerColumns = [
                "name",
                "class",
                "is_real",
                "campaign_id",
            ];

            const playerValues = [
                player.name,
                player.class,
                isRealBoolean,
                campaignId,
            ];

            const [newPlayer] = await insertStatement(
                "player",
                insertPlayerColumns,
                playerValues
            );
            return newPlayer.insertId;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = PlayerController;
