const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CampaignSchema = new Schema({
    name: { type: String, required: true, minLength: 1 },
    desc: { type: String, required: true, minLength: 1 },
    // image?
});

module.exports = mongoose.model("Campaign", CampaignSchema);
