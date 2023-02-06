const mongoose = require("mongoose");
const Changelog = require("../models/changelog");

class ChangelogController {
    // Fetch changelog data when a campaign is selected
    async changelogData(campaignId) {
        try {
            return await Changelog.findOne(
                { campaign: campaignId },
                "-_id -campaign -__v" // Return all values except the ones inside of the projection string
            );
        } catch (err) {
            throw err;
        }
    }

    // Update relevant changelog document
    async updateChangelog(campaignId, username, dataName, reqUrl) {
        try {
            // Search for changelog document within the database
            let changelogDocument = await Changelog.findOne({
                campaign: campaignId,
            });

            // Check if changelog document exists, if it doesnt create a new one with the correct field values
            if (!changelogDocument) {
                const initialChangelogValues = {
                    campaign: mongoose.Types.ObjectId(campaignId),
                    changes: [],
                };
                const newChangelogDocument = new Changelog(
                    initialChangelogValues
                );
                await newChangelogDocument.save();
                changelogDocument = newChangelogDocument; // Update the changelogDocument variable
            }

            // Obtain changelog operation type and data affected
            const changelogUrl = reqUrl.replace("/", ""); // Remove the / at the start of the url
            const changelogDataArray = changelogUrl.split("_"); // Split the string into two separate words and return an array
            let pastTenseOperation = changelogDataArray[0].concat("", "d");
            // account for sublocation routes (sub location routes look like "OPERATION_sub_location", so the first index of the split array is just sub)
            if (changelogDataArray[1] === "sub") {
                changelogDataArray[1] = "sublocation";
            }

            // Account for locationless npc/quest update routes
            if (changelogDataArray[0] === "locationless") {
                pastTenseOperation = "updated";
            }

            // Date value used for time of request
            const date = new Date();

            // Create new data values using parameters
            const newChangelogData = {
                username: username,
                data_name: dataName,
                data_affected: changelogDataArray[1],
                operation_type: pastTenseOperation,
                created_at: date,
            };

            changelogDocument.changes.unshift(newChangelogData); // Push new data values into the document
            // Remove the earliest entry if the length of the document is greater than 50.
            // This number was picked because to me it is a nice number to show entries up to.
            // I would like to keep all log values, but as of now I am unsure how big the document will actually get when it is full (50 changes)
            while (changelogDocument.changes.length > 50) {
                changelogDocument.changes.pop();
            }
            changelogDocument.save(); // Save document

            // Return entire changelog document, which looks like:
            // {
            //     campaign: campaignId,
            //     changes: [
            //         ...changes, newChangelogData
            //     ]
            // }

            return changelogDocument;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ChangelogController;
