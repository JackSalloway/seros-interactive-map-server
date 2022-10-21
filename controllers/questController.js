const Quest = require("../models/quest");
const NPC = require("../models/npc");

const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const { npc } = require("../helpers/validators");

class QuestController {
    // Fetch all quest data when the app is started
    async questData(campaignID) {
        try {
            return await Quest.find({ campaign: campaignID }).populate(
                "associated_locations"
            );
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
    async deleteQuest(questId) {
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
            return await NPC.find({})
                .populate("quests")
                .populate("associated_locations");
        } catch (err) {
            throw err;
        }
    }

    // Update a specific quest
    async updateQuest(questId, data) {
        try {
            const questResult = await Quest.findOneAndUpdate(
                { _id: questId },
                { $set: data },
                { new: true }
            )
                .populate("associated_locations")
                .lean()
                .exec();

            const npcResult = await NPC.find({})
                .populate("quests")
                .populate("associated_locations");
            return { questResult, npcResult };
        } catch (err) {
            throw err;
        }
    }
}

module.exports = QuestController;
