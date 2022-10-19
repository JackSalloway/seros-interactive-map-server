// Initial update for all quests to add campaign value referencing 1 ObjectId
// This is tie specific quests to the relevant campaign
// campaign: ObjectId

require("dotenv").config();
const mongoose = require("mongoose");
const Quest = require("../models/quest");

const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Seros is the name of my current campaign
const serosCampaignId = "62fe09d6a6e27cf4bb56919e";

Quest.updateMany(
    {},
    { $set: { campaign: mongoose.Types.ObjectId(serosCampaignId) } }
).then((result) =>
    console.log(
        "Update successful: %d matched, %d modified",
        result.matchedCount,
        result.modifiedCount
    )
);
