const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const NPCSchema = new Schema({
    name: { type: String, required: true },
    race: { type: String, required: true },
    desc: { type: String, required: true },
    disposition: { type: String, required: true },
    important: { type: Boolean, required: true },
    associated_locations: [{ type: Schema.Types.ObjectId, ref: "Location" }],
    quests: [{ type: Schema.Types.ObjectId, ref: "Quest" }],
});

// Create virtual for url, not sure if I will need this but could be handy
NPCSchema.virtual("url").get(function () {
    return "/" + this._id;
});

// Export model
module.exports = mongoose.model("NPC", NPCSchema);
