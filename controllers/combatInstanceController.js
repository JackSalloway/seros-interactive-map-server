const database = require("../services/database");
// const mongoose = require("mongoose");
// const CombatInstance = require("../models/combat_instance");

class CombatInstanceController {
    // Fetch combat instance data when a campaign is selected
    async combatInstanceData(campaignId) {
        try {
            const combatInstanceQuery = `SELECT combat_instance.id AS 'combat_instance_id', combat_instance.name, combat_instance.description,
            location_id, campaign_id
            FROM combat_instance JOIN location ON location.id = combat_instance.location_id
            WHERE campaign_id = '${campaignId}'`;
            const [combatInstances, _combatInstanceField] =
                await database.query(combatInstanceQuery);

            const combatInstanceTurnsQuery = `SELECT combat_instance_player_turn.id AS 'player_turn_id', turn_number, damage, healing, 
            player_id, player.name AS 'player_name', combat_instance_id, campaign.id AS 'campaign_id'
            FROM tactical_journal.combat_instance_player_turn
            JOIN player ON player.id = combat_instance_player_turn.player_id
            JOIN campaign ON campaign.id = player.campaign_id
            WHERE campaign_id = '${campaignId}'`;
            const [combatInstanceTurns, _combatInstanceTurnField] =
                await database.query(combatInstanceTurnsQuery);

            for (const combatInstance of combatInstances) {
                const playerTurns = combatInstanceTurns.reduce(
                    (player, turn) => {
                        if (
                            turn.combat_instance_id !==
                            combatInstance.combat_instance_id
                        ) {
                            return null;
                        }
                        const { player_name } = turn;
                        player[player_name] = player[player_name] ?? [];
                        player[player_name].push(turn);
                        return player;
                    },
                    {}
                );
                combatInstance.player_turns = playerTurns;
            }

            return null;
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
