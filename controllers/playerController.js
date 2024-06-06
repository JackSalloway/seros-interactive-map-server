const database = require("../services/database");
const { insertStatement } = require("../helpers/queries");

class PlayerController {
    // Add a new player to a specific campaign
    async addNewPlayer(player, campaignId) {
        try {
            const insertPlayerColumns = [
                "name",
                "class",
                "is_real",
                "campaign_id",
            ];

            const playerValues = [
                player.name,
                player.class,
                player.isReal,
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
