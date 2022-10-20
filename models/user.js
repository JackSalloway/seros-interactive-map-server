const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true, minLength: 3 },
    email: {
        type: String,
        required: true,
        lowercase: true,
        // match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: { type: String, required: true },
    privileged: { type: Boolean, required: true },
    refresh_token: { type: String },
    campaigns: [
        {
            campaign: { type: Schema.Types.ObjectId, ref: "Campaign" },
            admin: { type: Boolean, required: true },
        },
    ],
});

module.exports = mongoose.model("user", UserSchema);
