const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const InviteSchema = new Schema({
    code: { type: String, required: true },
    created_at: { type: Date, default: Date.now, expires: 3600 },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign" },
});

module.exports = mongoose.model("Invite", InviteSchema);
