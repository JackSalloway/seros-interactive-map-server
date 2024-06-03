const database = require("../services/database");
const {
    insertStatement,
    selectQuery,
    updateStatement,
    deleteStatement,
} = require("../helpers/queries");

const npcColumns = [
    "id",
    "name",
    "description",
    "race",
    "disposition",
    "status",
    "updated_at",
];

class NPCController {
    // Fetch all NPC data when the app is started
    async npcData(campaignId) {
        try {
            // Select all unique rows of npcs using the campaign_id value
            const npcQuery = `SELECT ?? AS ??, ??, ??, ??, ??, ??, ??
            FROM ??
            JOIN ?? ON ?? = ??
            JOIN ?? ON ?? = ??
            WHERE ?? = ?
            GROUP BY ??`;

            const npcParams = [
                "npc.id",
                "npc_id",
                "npc.name",
                "npc.description",
                "race",
                "disposition",
                "status",
                "npc.updated_at",
                "npc",
                "location_npcs",
                "location_npcs.npc_id",
                "npc.id",
                "location",
                "location.id",
                "location_npcs.location_id",
                "location.campaign_id",
                campaignId,
                "npc_id",
            ];

            const [npcs, _npcField] = await database.query(npcQuery, npcParams);

            // Select all the relevant quest_npcs rows using the campaign_id value
            const npcQuestsQuery = `SELECT DISTINCT ??, ??,
            ?? AS ?? FROM ??
            JOIN ?? ON ?? = ??
            JOIN ?? ON ?? = ??
            JOIN ?? ON ?? = ??
            JOIN ?? ON ?? = ??
            WHERE ?? = ?`;

            const npcQuestsParams = [
                "quest_id",
                "quest_npcs.npc_id",
                "quest.name",
                "quest_name",
                "quest_npcs",
                "npc",
                "npc.id",
                "quest_npcs.npc_id",
                "quest",
                "quest.id",
                "quest_npcs.quest_id",
                "location_npcs",
                "location_npcs.npc_id",
                "quest_npcs.npc_id",
                "location",
                "location.id",
                "location_npcs.location_id",
                "location.campaign_id",
                campaignId,
            ];

            const [npcQuests, _npcQuestField] = await database.query(
                npcQuestsQuery,
                npcQuestsParams
            );

            // Select all the relevant location_npcs rows using the campaign_id value
            const npcLocationsQuery = `SELECT ??, ??,
            ?? AS ??, ??, ?? FROM ??
            JOIN ?? ON ?? = ??
            JOIN ?? ON ?? = ??
            WHERE ?? = ?`;

            const npcLocationsParams = [
                "location_id",
                "npc_id",
                "location.name",
                "location_name",
                "latitude",
                "longitude",
                "location_npcs",
                "npc",
                "npc.id",
                "location_npcs.npc_id",
                "location",
                "location.id",
                "location_npcs.location_id",
                "location.campaign_id",
                campaignId,
            ];

            const [npcLocations, _npcLocationField] = await database.query(
                npcLocationsQuery,
                npcLocationsParams
            );

            const npcData = npcs.map((npc) => {
                // Create npc object
                let npcObject = {
                    id: npc.npc_id,
                    name: npc.name,
                    description: npc.description,
                    race: npc.race,
                    disposition: npc.disposition,
                    status: npc.status,
                    updated_at: npc.updated_at,
                    associated_locations: [],
                    associated_quests: [],
                    campaign: {
                        id: campaignId,
                    },
                };

                // Assign all associated locations to npcObject
                npcLocations.forEach((npcLocation) => {
                    // Early return if current npcLocation in loop is not related to the current npc
                    if (npcLocation.npc_id !== npcObject.id) {
                        return;
                    }

                    // Push associated location to relevant npcObject
                    npcObject.associated_locations.push({
                        id: npcLocation.location_id,
                        name: npcLocation.location_name,
                        latlng: {
                            lat: npcLocation.latitude,
                            lng: npcLocation.longitude,
                        },
                    });
                });

                // Assign all associated quests to npcObject
                npcQuests.forEach((npcQuest) => {
                    // Early return if current npcQuest in loop is not related to the current npc
                    if (npcQuest.npc_id !== npcObject.id) {
                        return;
                    }

                    // Push associated quest to relevant npcObject
                    npcObject.associated_quests.push({
                        id: npcQuest.quest_id,
                        name: npcQuest.quest_name,
                    });
                });

                return npcObject;
            });

            return npcData;
        } catch (err) {
            throw err;
        }
    }

    // Create a new  npc
    async createNPC(data) {
        try {
            const {
                name,
                race,
                description,
                disposition,
                status,
                associated_locations,
                associated_quests,
                campaignId,
            } = data;

            // Insert new npc into the database
            const insertNPCColumns = [
                "name",
                "description",
                "race",
                "disposition",
                "status",
            ];

            const npcValues = [name, description, race, disposition, status];

            const [newNPC] = await insertStatement(
                "npc",
                insertNPCColumns,
                npcValues
            );

            // Create any required new locationNPC rows
            associated_locations.forEach(async (locationId) => {
                const insertLocationNPCColumns = ["location_id", "npc_id"];
                const locationNPCValues = [locationId, newNPC.insertId];
                await insertStatement(
                    "location_npcs",
                    insertLocationNPCColumns,
                    locationNPCValues
                );
            });

            // Create any required new questNPC rows
            associated_quests.forEach(async (questId) => {
                const insertQuestNPCColumns = ["quest_id", "npc_id"];
                const questNPCValues = [questId, newNPC.insertId];
                await insertStatement(
                    "quest_npcs",
                    insertQuestNPCColumns,
                    questNPCValues
                );
            });

            // Select only the new npc from the database
            const [newNPCData, _newNPCField] = await selectQuery(
                "npc",
                npcColumns,
                "id",
                newNPC.insertId
            );

            // Select only the relevant locations to the new npc
            const npcLocationsQuery = `SELECT ??, ??,
            ?? AS ??, ??, ?? FROM ??
            JOIN ?? ON ?? = ??
            JOIN ?? ON ?? = ??
            WHERE ?? = ?`;

            const npcLocationsParams = [
                "location_id",
                "npc_id",
                "location.name",
                "location_name",
                "latitude",
                "longitude",
                "location_npcs",
                "npc",
                "npc.id",
                "location_npcs.npc_id",
                "location",
                "location.id",
                "location_npcs.location_id",
                "npc_id",
                newNPC.insertId,
            ];

            const [newNPCLocationsData, _npcLocationField] =
                await database.query(npcLocationsQuery, npcLocationsParams);

            // Select only the relevant quests to the new npc
            const newNPCQuestsQuery = `SELECT ??, ??,
            ?? AS ?? FROM ??
            JOIN ?? ON ?? = ??
            JOIN ?? ON ?? = ??
            WHERE ?? = ?`;

            const newNPCQuestsParams = [
                "quest_id",
                "quest_npcs.npc_id",
                "quest.name",
                "quest_name",
                "quest_npcs",
                "npc",
                "npc.id",
                "quest_npcs.npc_id",
                "quest",
                "quest.id",
                "quest_npcs.quest_id",
                "npc_id",
                newNPC.insertId,
            ];

            const [newNPCQuestsData, _npcQuestField] = await database.query(
                newNPCQuestsQuery,
                newNPCQuestsParams
            );

            // Create and populate the associated_locations value
            newNPCData.associated_locations = newNPCLocationsData.map(
                (location) => {
                    return {
                        id: location.location_id,
                        name: location.location_name,
                        latlng: {
                            lat: location.latitude,
                            lng: location.longitude,
                        },
                    };
                }
            );

            // Create and populate the associated_quests value
            newNPCData.associated_quests = newNPCQuestsData.map((quest) => {
                return {
                    id: quest.quest_id,
                    name: quest.quest_name,
                };
            });

            // Create and populate campaign value
            newNPCData.campaign = { id: campaignId };

            return newNPCData;
        } catch (err) {
            throw err;
        }
    }

    // Delete an NPC
    async deleteNPC(npcId) {
        try {
            // Create delete statement
            await deleteStatement("npc", "id", npcId);
            return;
        } catch (err) {
            throw err;
        }
    }

    async updateNPC(npcId, data, campaignId) {
        try {
            const {
                name,
                description,
                race,
                disposition,
                status,
                associated_locations,
                quests,
            } = data;

            // Create delete statement and delete all existing location_npcs rows
            await deleteStatement("location_npcs", "npc_id", npcId);

            // Create insert statements
            associated_locations.forEach(async (locationId) => {
                const insertLocationNPCColumns = ["location_id", "npc_id"];
                const locationNPCValues = [locationId, npcId];
                await insertStatement(
                    "location_npcs",
                    insertLocationNPCColumns,
                    locationNPCValues
                );
            });

            // Create delete statement and delete all existing quest_npcs rows
            await deleteStatement("quest_npcs", "npc_id", npcId);

            // Create insert statements
            quests.forEach(async (questId) => {
                const insertQuestNPCColumns = ["quest_id", "npc_id"];
                const questNPCValues = [questId, npcId];
                await insertStatement(
                    "quest_npcs",
                    insertQuestNPCColumns,
                    questNPCValues
                );
            });

            // Update the relevant npc
            const columnsPlusValues = {
                name: name,
                description: description,
                race: race,
                disposition: disposition,
                status: status,
            };
            await updateStatement("npc", columnsPlusValues, "id", npcId);

            // Select only the updated npc
            const [npc, _npcField] = await selectQuery(
                "npc",
                npcColumns,
                "id",
                npcId
            );

            // Select only the relevant quests to the new npc
            const npcLocationsQuery = `SELECT ?? AS ??,
            ??, ??, ?? FROM ??
            JOIN ?? ON ?? = ??
            JOIN ?? ON ?? = ??
            WHERE ?? = ?`;

            const npcLocationsParams = [
                "location_id",
                "id",
                "location.name",
                "latitude",
                "longitude",
                "location_npcs",
                "npc",
                "npc.id",
                "location_npcs.npc_id",
                "location",
                "location.id",
                "location_npcs.location_id",
                "npc_id",
                npcId,
            ];

            const [npcLocationsData, _npcLocationField] = await database.query(
                npcLocationsQuery,
                npcLocationsParams
            );

            // Select only the relevant quests to the new npc
            const npcQuestsQuery = `SELECT ?? AS ??,
            ?? FROM ??
            JOIN ?? ON ?? = ??
            JOIN ?? ON ?? = ??
            WHERE ?? = ?`;

            const npcQuestsParams = [
                "quest_id",
                "id",
                "quest.name",
                "quest_npcs",
                "npc",
                "npc.id",
                "quest_npcs.npc_id",
                "quest",
                "quest.id",
                "quest_npcs.quest_id",
                "npc_id",
                npcId,
            ];

            const [npcQuestsData, _npcQuestField] = await database.query(
                npcQuestsQuery,
                npcQuestsParams
            );

            // Assemble updated npc object
            const npcObject = {
                id: npc.id,
                name: npc.name,
                description: npc.description,
                race: npc.race,
                disposition: npc.disposition,
                status: npc.status,
                updated_at: npc.updated_at,
                associated_locations: npcLocationsData.map((location) => {
                    return {
                        id: location.id,
                        name: location.name,
                        latlng: {
                            lat: location.latitude,
                            lng: location.longitude,
                        },
                    };
                }),
                associated_quests: npcQuestsData,
                campaign: {
                    id: campaignId,
                },
            };

            return npcObject;
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
