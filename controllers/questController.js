const database = require("../services/database");
// const { body, validationResult } = require("express-validator");
// const { npc, campaign } = require("../helpers/validators");

class QuestController {
    // Fetch all quest data when the app is started
    async questData(campaignID) {
        try {
            const questQuery = `SELECT DISTINCT quest.id AS 'quest_id' , quest.name, quest.description, completed, quest.updated_at,
            campaign_id FROM tactical_journal.quest
            JOIN location_quests ON location_quests.quest_id = quest.id
            JOIN location ON location.id = location_quests.location_id
            WHERE campaign_id = '${campaignID}';`;
            const [quests, _questField] = await database.execute(questQuery);

            const locationQuestsQuery = `SELECT location_id, quest_id,
            location.name AS 'location_name', latitude, longitude FROM location_quests
            JOIN quest on quest.id = location_quests.quest_id
            JOIN location on location.id = location_quests.location_id
            WHERE campaign_id = '${campaignID}';`;
            const [locationQuests, locationQuestsField] =
                await database.execute(locationQuestsQuery);

            const questData = quests.map((quest) => {
                // Create quest object
                let questObject = {
                    id: quest.quest_id,
                    name: quest.name,
                    description: quest.description,
                    updated_at: quest.updated_at,
                    completed: Boolean(quest.completed),
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
            const completedBoolean = completed === "true" ? 1 : 0;

            // Insert new quest into the database
            const createQuestStatement = `INSERT INTO quest
            (name, description, completed)
            VALUES ('${name}', '${description}', ${completedBoolean});`;
            const [newQuest] = await database.execute(createQuestStatement);

            // Create any required new locationQuest rows
            associated_locations.forEach(async (locationId) => {
                const createLocationQuestStatement = `INSERT INTO location_quests
                (location_id, quest_id)
                VALUES(${locationId}, ${newQuest.insertId})`;
                await database.execute(createLocationQuestStatement);
            });

            // Select only the new quest from the database
            const newQuestQuery = `SELECT id, name, description, completed, updated_at
            FROM quest WHERE id = ${newQuest.insertId}`;
            const [newQuestData, _newQuestField] = await database.execute(
                newQuestQuery
            );

            // Select only the new location_quest rows
            const newLocationQuestsQuery = `SELECT location_id, quest_id,
            location.name AS 'location_name', latitude, longitude FROM location_quests
            JOIN quest on quest.id = location_quests.quest_id
            JOIN location on location.id = location_quests.location_id
            WHERE quest_id = ${newQuest.insertId}`;
            const [newLocationQuestsData, _locationQuestsField] =
                await database.execute(newLocationQuestsQuery);

            // Add relevant data to object from other tables and then return newQuestData object
            newQuestData[0].associated_locations = newLocationQuestsData.map(
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
            newQuestData[0].campaign = {
                id: campaignId,
            };

            return newQuestData[0];
        } catch (err) {
            throw err;
        }
    }

    // Delete a specifc quest and remove the quest from any NPCs that have it assigned
    async deleteQuest(questId, campaignId) {
        try {
            // Remove references to quest from any NPCs that reference it
            await NPC.updateMany(
                {},
                { $pull: { quests: mongoose.Types.ObjectId(questId) } }
            );
            // Update important field for all npcs that have no quests
            await NPC.updateMany(
                { quests: { $exists: true, $size: 0 } },
                { $set: { important: false } }
            );
            await Quest.findByIdAndDelete(questId);
            return await NPC.find({ campaign: campaignId })
                .populate("quests")
                .populate("associated_locations");
        } catch (err) {
            throw err;
        }
    }

    // Update a specific quest
    async updateQuest(questId, data, campaignId) {
        try {
            // Convert boolean values into numbers to satisfy TINYINT data type in SQL schema
            const completedBoolean = data.completed === "true" ? 1 : 0;

            // Create delete statement and delete all existing location_quest rows
            const locationQuestsDeleteStatement = `DELETE FROM location_quests WHERE quest_id = ${questId}`;
            await database.execute(locationQuestsDeleteStatement);
            // Create insert statements for each id in the associated_locations array
            data.associated_locations.forEach(async (locationId) => {
                const createLocationQuestStatement = `INSERT INTO location_quests
                    (location_id, quest_id)
                    VALUES (${locationId}, ${questId})`;
                await database.execute(createLocationQuestStatement);
            });

            // Update relevant quest row
            const updateQuestStatement = `UPDATE quest
            SET name = '${data.name}', description = '${data.description}', completed = ${completedBoolean}
            WHERE id = ${questId}`;
            await database.execute(updateQuestStatement);

            // QUERY NEW QUEST
            // Query the updated quest
            const questQuery = `SELECT * FROM quest WHERE id = ${questId}`;
            const [quest, _questField] = await database.execute(questQuery);

            // Query the updated location_quests rows
            const questLocationsQuery = `SELECT location_id AS 'id',
            location.name, latitude, longitude FROM location_quests
            JOIN location on location.id = location_quests.location_id
            WHERE quest_id = ${questId}`;
            const [questLocationsData, _locationQuestsField] =
                await database.execute(questLocationsQuery);

            // Assemble updated quest object
            const questObject = {
                id: quest[0].id,
                name: quest[0].name,
                description: quest[0].description,
                completed: Boolean(quest[0].completed),
                updated_at: quest[0].updated_at,
                associated_locations: questLocationsData.map((location) => {
                    return {
                        id: location.id,
                        name: location.name,
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
