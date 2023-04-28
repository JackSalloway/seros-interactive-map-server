const mongoose = require("mongoose");
const CombatInstance = require("../models/combat_instance");

class CombatInstanceController {
    // Fetch combat instance data when a campaign is selected
    async combatInstanceData(campaignId) {
        try {
            return await CombatInstance.findOne(
                { campaign: campaignId },
                "-_id -campaign -__v" // Return all values except the ones inside of the projection string
            );
        } catch (err) {
            throw err;
        }
    }
}

module.exports = CombatInstanceController;
