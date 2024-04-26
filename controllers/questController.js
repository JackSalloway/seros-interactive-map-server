const database = require("../services/database");
const { body, validationResult } = require("express-validator");
const { npc, campaign } = require("../helpers/validators");

class QuestController {
    // Fetch all quest data when the app is started
    async questData(campaignID) {
        try {
            const questQuery = `SELECT DISTINCT quest.id AS 'quest_id' , quest.name, quest.description, completed,
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
                        latitude: locationQuest.latitude,
                        longitude: locationQuest.longitude,
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
            const quest = new Quest(data);
            await quest.save();
            return Quest.find({ _id: quest.id })
                .populate("associated_locations")
                .lean()
                .exec();
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
            const questResult = await Quest.findOneAndUpdate(
                { _id: questId },
                { $set: data },
                { new: true }
            )
                .populate("associated_locations")
                .lean()
                .exec();

            const npcResult = await NPC.find({ campaign: campaignId })
                .populate("quests")
                .populate("associated_locations");
            return { questResult, npcResult };
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
