const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CampaignSchema = new Schema({
    name: { type: String, required: true, minLength: 1 },
    desc: { type: String, required: true, minLength: 1 },
    players: [
        {
            name: { type: String, minLength: 1 },
            class: { type: String, minlength: 1 },
        },
    ],
    // map image?
    // banner image?
});

module.exports = mongoose.model("Campaign", CampaignSchema);
