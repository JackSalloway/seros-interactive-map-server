const mongoose = require("mongoose");
const Changelog = require("../models/changelog");

class ChangelogController {
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

            changelogDocument.changes.push(newChangelogData); // Push new data values into the document
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
