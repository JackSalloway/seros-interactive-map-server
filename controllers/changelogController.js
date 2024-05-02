// const mongoose = require("mongoose");
// const Changelog = require("../models/changelog");
const database = require("../services/database");

class ChangelogController {
    // Fetch changelog data when a campaign is selected
    async changelogData(campaignId) {
        try {
            const changelogQuery = `SELECT * FROM changelog WHERE campaign_id = '${campaignId}'`;
            const [changelogs, _changelogField] = await database.execute(
                changelogQuery
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

            // Insert new changelog into the SQL database
            const newChangelogStatement = `INSERT INTO changelog
            (user, action, data_name, data_affected, campaign_id)
            VALUES ('${username}', '${pastTenseOperation}', '${dataName}', '${changelogDataArray[1]}', '${campaignId}')`;
            const [newChangelog] = await database.execute(
                newChangelogStatement
            );

            const changelogQuery = `SELECT * FROM changelog WHERE id = ${newChangelog.insertId}`;
            const [newChangelogData, _changelogField] = await database.execute(
                changelogQuery
            );

            return newChangelogData[0];
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ChangelogController;
