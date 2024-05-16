const database = require("../services/database");
const { insertStatement } = require("../helpers/queries");

const changelogQuery = `SELECT * FROM ?? WHERE ?? = ?`;

class ChangelogController {
    // Fetch changelog data when a campaign is selected
    async changelogData(campaignId) {
        try {
            const [changelogs, _changelogField] = await database.query(
                changelogQuery,
                ["changelog", "campaign_id", campaignId]
            );

            return changelogs;
        } catch (err) {
            throw err;
        }
    }

    // Update relevant changelog document
    async updateChangelog(campaignId, username, dataName, reqUrl) {
        try {
            // Obtain changelog operation type and data affected
            const changelogUrl = reqUrl.replace("/", ""); // Remove the / at the start of the url
            const changelogDataArray = changelogUrl.split("_"); // Split the string into two separate words and return an array
            let pastTenseOperation = changelogDataArray[0].concat("", "d");
            // account for sublocation routes (sub location routes look like "OPERATION_sub_location", so the first index of the split array is just sub)
            if (changelogDataArray[1] === "sub") {
                changelogDataArray[1] = "sublocation";
            }

            if (changelogDataArray[1] === "combat") {
                changelogDataArray[1] = "combat log";
            }

            // Account for locationless npc/quest update routes
            if (changelogDataArray[0] === "locationless") {
                pastTenseOperation = "updated";
            }

            const insertChangelogColumns = [
                "user",
                "action",
                "data_name",
                "data_affected",
                "campaign_id",
            ];

            const changelogValues = [
                username,
                pastTenseOperation,
                dataName,
                changelogDataArray[1],
                campaignId,
            ];

            // Insert new changelog into the SQL database
            const [newChangelog] = await insertStatement(
                "changelog",
                insertChangelogColumns,
                changelogValues
            );

            // Query for the newly created changelog row
            const [newChangelogData, _changelogField] = await database.query(
                changelogQuery,
                ["changelog", "id", newChangelog.insertId]
            );

            return newChangelogData;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ChangelogController;
