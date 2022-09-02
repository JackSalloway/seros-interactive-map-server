const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LocationSchema = new Schema({
    name: { type: String, required: true, minLength: 5, maxLength: 75 },
    region: { type: String, required: true },
    latlng: {
        // Unsure if this is the correct way to do this, specifically the type of lat/lng
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    type: { type: String, required: true },
    visited: { type: Boolean, required: true },
    marked: { type: Boolean, required: true },
    desc: { type: String, required: true, minLength: 15 },
    sub_locations: [
        {
            name: { type: String, minLength: 3 },
            desc: { type: String, minLength: 10 },
        },
    ],
});

// Create virtual for url, not sure if I will need this but could be handy
LocationSchema.virtual("url").get(function () {
    return "/" + this._id;
});

// Export model
module.exports = mongoose.model("Location", LocationSchema);
