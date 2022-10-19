// Initial update for all users to add campaign value referencing at least 1 ObjectId
// This will be used to authorize users to specific campaigns
// campaigns: [ObjectId]

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Seros is the name of my current campaign
const serosCampaignId = "62fe09d6a6e27cf4bb56919e";

User.updateMany(
    {},
    { $set: { campaigns: [mongoose.Types.ObjectId(serosCampaignId)] } }
).then((result) =>
    console.log(
        "Update successful: %d matched, %d modified",
        result.matchedCount,
        result.modifiedCount
    )
);
