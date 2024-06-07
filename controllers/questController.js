const database = require("../services/database");
const {
    insertStatement,
    updateStatement,
    deleteStatement,
    selectQuery,
} = require("../helpers/queries");
// const { body, validationResult } = require("express-validator");
// const { npc, campaign } = require("../helpers/validators");

// Quest prepared statement values
const defaultQuestQuery = `SELECT DISTINCT ?? AS ??, ??, ??, ??, ??,
?? FROM ??
JOIN ?? ON ?? = ??
JOIN ?? ON ?? = ??
WHERE ?? = ?`;

const defaultQuestParams = [
    "quest.id",
    "quest_id",
    "quest.name",
    "quest.description",
    "completed",
    "quest.updated_at",
    "location.campaign_id",
    "quest",
    "location_quests",
    "location_quests.quest_id",
    "quest.id",
    "location",
    "location.id",
    "location_quests.location_id",
    "location.campaign_id",
];

const defaultQuestQueryColumns = [
    "id",
    "name",
    "description",
    "completed",
    "updated_at",
];

// Location_quests prepared statement values
const defaultLocationQuestsQuery = `SELECT ??, ??,
?? AS ??, ??, ?? FROM ??
JOIN ?? ON ?? = ??
JOIN ?? ON ?? = ??
WHERE ?? = ?`;

const defaultLocationQuestsParams = [
    "location_id",
    "quest_id",
    "location.name",
    "location_name",
    "latitude",
    "longitude",
    "location_quests",
    "quest",
    "quest.id",
    "location_quests.quest_id",
    "location",
    "location.id",
    "location_quests.location_id",
];

const insertLocationQuestColumns = ["location_id", "quest_id"];

class QuestController {
    // Fetch all quest data when the app is started
    async questData(campaignId) {
        try {
            const [quests, _questField] = await database.query(
                defaultQuestQuery,
                [...defaultQuestParams, campaignId]
            );

            const [locationQuests, _locationQuestsField] = await database.query(
                defaultLocationQuestsQuery,
                [
                    ...defaultLocationQuestsParams,
                    "location.campaign_id",
                    campaignId,
                ]
            );

            const questData = quests.map((quest) => {
                // Create quest object
                let questObject = {
                    id: quest.quest_id,
                    name: quest.name,
                    description: quest.description,
                    updated_at: quest.updated_at,
                    completed: quest.completed === 1 ? true : false,
                    associated_locations: [],
                    campaign: {
                        id: quest.campaign_id,
                    },
                };

                locationQuests.forEach((locationQuest) => {
                    // Early return if current locationQuest in loop is not related to the current quest
                    if (locationQuest.quest_id !== questObject.id) {
                        return;
                    }

                    // Push associated location to relevant quest object
                    questObject.associated_locations.push({
                        id: locationQuest.location_id,
                        name: locationQuest.location_name,
                        latlng: {
                            lat: locationQuest.latitude,
                            lng: locationQuest.longitude,
                        },
                    });
                });

                return questObject;
            });

            return questData;
        } catch (err) {
            throw err;
        }
    }

    // Create a new quest
    async createQuest(data) {
        try {
            const {
                name,
                description,
                completed,
                associated_locations,
                campaignId,
            } = data;

            // Convert completed value to numbers to satisfy the TINYINT data type in the SQL table
            let completedBoolean = 0;
            if (completed === "true") completedBoolean = 1;

            // Insert new quest into the database
            const insertQuestColumns = [
                "name",
                "description",
                "completed",
                "campaign_id",
            ];
            const questValues = [
                name,
                description,
                completedBoolean,
                campaignId,
            ];
            const [newQuest] = await insertStatement(
                "quest",
                insertQuestColumns,
                questValues
            );

            // Create any required new locationQuest rows
            associated_locations.forEach(async (locationId) => {
                const locationQuestsValues = [locationId, newQuest.insertId];
                await insertStatement(
                    "location_quests",
                    insertLocationQuestColumns,
                    locationQuestsValues
                );
            });

            // Select only the new quest from the database
            const [newQuestData, _newQuestField] = await selectQuery(
                "quest",
                defaultQuestQueryColumns,
                "id",
                newQuest.insertId
            );

            // Select only the new location_quest rows
            const [newLocationQuestsData, _locationQuestsField] =
                await database.query(defaultLocationQuestsQuery, [
                    ...defaultLocationQuestsParams,
                    "quest_id",
                    newQuest.insertId,
                ]);

            // Update quest.completed value to a Boolean
            if (newQuestData.completed === 1) newQuestData.completed = true;
            else newQuestData.completed = false;

            // Add relevant data to object from other tables and then return newQuestData object
            newQuestData.associated_locations = newLocationQuestsData.map(
                (locationQuest) => {
                    return {
                        id: locationQuest.location_id,
                        name: locationQuest.location_name,
                        latlng: {
                            lat: locationQuest.latitude,
                            lng: locationQuest.longitude,
                        },
                    };
                }
            );
            newQuestData.campaign = {
                id: campaignId,
            };

            return newQuestData;
        } catch (err) {
            throw err;
        }
    }

    // Delete a specifc quest and remove the quest from any NPCs that have it assigned
    async deleteQuest(questId) {
        try {
            // Create delete statement - because on delete cascade is enabled, only the relevant quest has to be deleted.
            await deleteStatement("quest", "id", questId);
        } catch (err) {
            throw err;
        }
    }

    // Update a specific quest
    async updateQuest(questId, data, campaignId) {
        try {
            const {
                name,
                description,
                completed,
                associated_locations,
                campaignId,
            } = data;

            // Convert boolean values into numbers to satisfy TINYINT data type in SQL schema
            let completedBoolean = 0;
            if (completed === "true") completedBoolean = 1;

            // Create delete statement and delete all existing location_quests rows
            await deleteStatement("location_quests", "quest_id", questId);

            // Create insert statements for each id in the associated_locations array
            associated_locations.forEach(async (locationId) => {
                const locationQuestsValues = [locationId, questId];
                await insertStatement(
                    "location_quests",
                    insertLocationQuestColumns,
                    locationQuestsValues
                );
            });

            // Update relevant quest row
            const columnsPlusValues = {
                name: name,
                description: description,
                completed: completedBoolean,
            };
            await updateStatement("quest", columnsPlusValues, "id", questId);

            // Query the updated quest
            const [quest, _questField] = await selectQuery(
                "quest",
                defaultQuestQueryColumns,
                "id",
                questId
            );

            // Query the updated location_quests rows
            const [locationQuestsData, _locationQuestsField] =
                await database.query(defaultLocationQuestsQuery, [
                    ...defaultLocationQuestsParams,
                    "quest_id",
                    questId,
                ]);

            // Assemble updated quest object
            const questObject = {
                id: quest.id,
                name: quest.name,
                description: quest.description,
                completed: quest.completed === 1 ? true : false,
                updated_at: quest.updated_at,
                associated_locations: locationQuestsData.map((location) => {
                    return {
                        id: location.location_id,
                        name: location.location_name,
                        latlng: {
                            lat: location.latitude,
                            lng: location.longitude,
                        },
                    };
                }),
                campaign: {
                    id: campaignId,
                },
            };

            return questObject;
        } catch (err) {
            throw err;
        }
    }

    // Update a locationless quest
    async updateLocationlessQuest(questId, locations) {
        try {
            // As this route only updates the locations for a quest, it will not have to update any npc values like the other routes do
            const result = await Quest.findOneAndUpdate(
                { _id: questId },
                {
                    $push: { associated_locations: locations },
                },
                { new: true }
            )
                .populate("associated_locations")
                .lean()
                .exec();

            return result;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = QuestController;
