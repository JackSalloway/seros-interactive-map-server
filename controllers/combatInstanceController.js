const mongoose = require("mongoose");
const CombatInstance = require("../models/combat_instance");

class CombatInstanceController {
    // Fetch combat instance data when a campaign is selected
    async combatInstanceData(campaignId) {
        try {
            return await CombatInstance.find(
                { campaign: campaignId },
                "-_id -campaign -__v" // Return all values except the ones inside of the projection string
            ).populate("associated_location");
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
