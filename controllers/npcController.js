const database = require("../services/database");
class NPCController {
    // Fetch all NPC data when the app is started
    async npcData(campaignID) {
        try {
            const npcQuery = `SELECT npc.id AS 'npc_id', npc.name, npc.description, race, disposition, location_npcs.location_id, status,
            location.id AS 'location_id' FROM npc
            JOIN location_npcs ON location_npcs.npc_id = npc.id
            JOIN location ON location.id = location_npcs.location_id
            WHERE campaign_id = '${campaignID}'`;
            const npcs = await database.execute(npcQuery);

            const npcQuestsQuery = `SELECT quest_id, quest_npcs.npc_id,
            quest.name AS 'quest_name' FROM quest_npcs
            JOIN npc on npc.id = quest_npcs.npc_id
            JOIN quest on quest.id = quest_npcs.quest_id
            JOIN location_npcs on location_npcs.npc_id = quest_npcs.npc_id
            JOIN location on location.id = location_npcs.location_id
            WHERE campaign_id = '${campaignID}'`;
            const npcQuests = await database.execute(npcQuestsQuery);

            const npcLocationsQuery = `SELECT location_id, npc_id,
            location.name AS 'location_name', latitude, longitude FROM location_npcs
            JOIN npc on npc.id = location_npcs.npc_id
            JOIN location on location.id = location_npcs.location_id
            WHERE campaign_id = '${campaignID}';`;
            const npcLocations = await database.execute(npcLocationsQuery);

            console.log(npcs);
            // console.log(npcQuests);
            // console.log(npcLocations);

            const npcData = npcs.map((npc) => {
                // Create npc object
                let npcObject = {
                    id: npc.npc_id,
                    name: npc.name,
                    description: npc.description,
                    race: npc.race,
                    disposition: npc.disposition,
                    status: npc.status,
                    associated_locations: [],
                    associated_quests: [],
                };
            });

            return npcs[0];
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

    async updateLocationlessNPC(npcId, locations) {
        try {
            const result = await NPC.findOneAndUpdate(
                { _id: npcId },
                {
                    $push: { associated_locations: locations },
                },
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
