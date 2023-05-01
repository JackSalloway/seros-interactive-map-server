const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CombatInstanceSchema = new Schema({
    combat_instance_details: [
        {
            player_name: { type: String, required: true, minLength: 1 },
            player_class: { type: String, required: true },
            turns: {
                damage: [Number],
                healing: [Number],
                deaths: [Number],
            },
        },
    ],
    name: { type: String, required: true, minLength: 1 },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    created_at: { type: Date, default: Date.now },
    associated_locations: { type: Schema.Types.ObjectId, ref: "Location" },
});

// Export model
module.exports = mongoose.model("CombatInstance", CombatInstanceSchema);
