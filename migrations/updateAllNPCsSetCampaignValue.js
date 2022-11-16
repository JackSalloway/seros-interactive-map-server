// Initial update for all NPCs to add campaign value referencing 1 ObjectId
// This is tie specific NPCs to the relevant campaign
// campaign: ObjectId

require("dotenv").config();
const mongoose = require("mongoose");
const NPC = require("../models/npc");

const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Seros is the name of my current campaign
const serosCampaignId = "635015d71ca3c3ef6865513a";

NPC.updateMany(
    {},
    { $set: { campaign: mongoose.Types.ObjectId(serosCampaignId) } }
).then((result) =>
    console.log(
        "Update successful: %d matched, %d modified",
        result.matchedCount,
        result.modifiedCount
    )
);
