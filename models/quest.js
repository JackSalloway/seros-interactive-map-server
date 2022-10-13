const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Quest = new Schema({
    name: { type: String, required: true, minLength: 1 },
    desc: { type: String, required: true, minLength: 1 },
    associated_locations: [{ type: Schema.Types.ObjectId, ref: "Location" }],
    completed: { type: Boolean, required: true },
});

// Create virtual for url, not sure if I will need this but could be handy
Quest.virtual("url").get(function () {
    return "/" + this._id;
});

// Export model
module.exports = mongoose.model("Quest", Quest);
