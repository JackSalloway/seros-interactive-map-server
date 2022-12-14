const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LocationSchema = new Schema({
    name: { type: String, required: true, minLength: 1, maxLength: 75 },
    region: { type: String, required: true },
    latlng: {
        // Unsure if this is the correct way to do this, specifically the type of lat/lng
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    type: { type: String, required: true },
    visited: { type: Boolean, required: true },
    marked: { type: Boolean, required: true },
    desc: { type: String, required: true, minLength: 1 },
    sub_locations: [
        {
            name: { type: String, minLength: 1 },
            desc: { type: String, minLength: 1 },
        },
    ],
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
});

// Create virtual for url, not sure if I will need this but could be handy
LocationSchema.virtual("url").get(function () {
    return "/" + this._id;
});

// Export model
module.exports = mongoose.model("Location", LocationSchema);
