const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CampaignSchema = new Schema({
    name: { type: String, required: true, minLength: 1 },
    desc: { type: String, required: true, minLength: 1 },
    // invites: [
    //     {
    //         invite_code: { type: String },
    //         created_at: { type: Date, default: Date.now },
    //         expires_at: { type: Date },
    //     },
    // ],
    // map image?
    // banner image?
});

module.exports = mongoose.model("Campaign", CampaignSchema);
