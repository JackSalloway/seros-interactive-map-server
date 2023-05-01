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
                // Chose to remove deaths for now to get a basic concept of the dps meter working first
                // deaths: [Number],
            },
        },
    ],
    name: { type: String, required: true, minLength: 1 },
    description: { type: String },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    created_at: { type: Date, default: Date.now },
    associated_location: { type: Schema.Types.ObjectId, ref: "Location" },
});

// Export model
module.exports = mongoose.model("CombatInstance", CombatInstanceSchema);
