const NPC = require("../models/npc");
class NPCController {
    // Fetch all NPC data when the app is started
    async npcData() {
        try {
            return await NPC.find({})
                .populate("quests")
                .populate("associated_locations");
        } catch (err) {
            throw err;
        }
    }

    // Create a new  npc
    async createNPC(data) {
        try {
            const npc = new NPC(data);
            await npc.save();
            return NPC.find({ _id: npc.id })
                .populate("quests")
                .populate("associated_locations")
                .lean()
                .exec();
        } catch (err) {
            throw err;
        }
    }

    // Delete an NPC
    async deleteNPC(npcId) {
        try {
            await NPC.findByIdAndDelete(npcId);
        } catch (err) {
            throw err;
        }
    }

    async updateNPC(npcId, data) {
        try {
            const result = await NPC.findOneAndUpdate(
                { _id: npcId },
                { $set: data },
                { new: true }
            )
                .populate("quests")
                .populate("associated_locations")
                .lean()
                .exec();
            return result;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = NPCController;
