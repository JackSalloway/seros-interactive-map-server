const database = require("../services/database");
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
                "campaign_id",
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
                "campaign_id",
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
                "campaign_id",
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
            const createNPCStatement = `INSERT INTO npc
            (name, description, race, disposition, status)
            VALUES ('${name}', '${description}', '${race}', '${disposition}', '${status}')`;
            const [newNPC] = await database.execute(createNPCStatement);

            // Create any required new locationNPC rows
            associated_locations.forEach(async (locationId) => {
                const createLocationNPCStatement = `INSERT INTO location_npcs
                (location_id, npc_id)
                VALUES (${locationId}, ${newNPC.insertId})`;
                await database.execute(createLocationNPCStatement);
            });

            // Create any required new questNPC rows
            associated_quests.forEach(async (questId) => {
                const createQuestNPCStatement = `INSERT INTO quest_npcs
                (quest_id, npc_id)
                VALUES (${questId}, ${newNPC.insertId})`;
                await database.execute(createQuestNPCStatement);
            });

            // Select only the new npc from the database
            const newNPCQuery = `SELECT id, name, description, race, disposition, status, updated_at
            FROM npc WHERE id = ${newNPC.insertId}`;
            const [newNPCData, _newNPCField] = await database.execute(
                newNPCQuery
            );

            // Select only the relevant locations to the new npc
            const newNPCLocationsQuery = `SELECT location_id, npc_id,
            location.name AS 'location_name', latitude, longitude FROM location_npcs
            JOIN npc on npc.id = location_npcs.npc_id
            JOIN location on location.id = location_npcs.location_id
            WHERE npc_id = '${newNPC.insertId}';`;
            const [newNPCLocationsData, _npcLocationField] =
                await database.execute(newNPCLocationsQuery);

            // Select only the relevant quests to the new npc
            const newNPCQuestsQuery = `SELECT quest_id, quest_npcs.npc_id,
            quest.name AS 'quest_name' FROM quest_npcs
            JOIN npc on npc.id = quest_npcs.npc_id
            JOIN quest on quest.id = quest_npcs.quest_id
            WHERE npc_id = ${newNPC.insertId}`;
            const [newNPCQuestsData, _npcQuestField] = await database.execute(
                newNPCQuestsQuery
            );

            // Create and populate the associated_locations value
            newNPCData[0].associated_locations = newNPCLocationsData.map(
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
            newNPCData[0].associated_quests = newNPCQuestsData.map((quest) => {
                return {
                    id: quest.quest_id,
                    name: quest.quest_name,
                };
            });

            newNPCData[0].campaign = { id: campaignId };

            // CLEANUP - only used for testing!
            // const deleteNPCLocationsStatement = `DELETE FROM location_npcs WHERE npc_id = ${newNPC.insertId}`;
            // const deleteNPCQuestsStatment = `DELETE FROM quest_npcs WHERE npc_id = ${newNPC.insertId}`;
            // const deleteNPCStatement = `DELETE FROM npc WHERE id = ${newNPC.insertId}`;

            // await database.execute(deleteNPCLocationsStatement);
            // await database.execute(deleteNPCQuestsStatment);
            // await database.execute(deleteNPCStatement);

            return newNPCData[0];
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

            // Check if associated_locations array is empty
            if (associated_locations.length !== 0) {
                // Create delete statement and delete all existing location_npcs rows
                const locationNPCDeleteStatement = `DELETE FROM location_npcs WHERE npc_id = ${npcId}`;
                await database.execute(locationNPCDeleteStatement);
                // Create insert statements
                associated_locations.forEach(async (locationId) => {
                    const createLocationNPCStatement = `INSERT INTO location_npcs
                    (location_id, npc_id)
                    VALUES (${locationId}, ${npcId})`;
                    await database.execute(createLocationNPCStatement);
                });
            }

            // Check if quests array is empty
            if (quests.length !== 0) {
                // Create delete statement and delete all existing quest_npcs rows
                const questNPCDeleteStatement = `DELETE FROM quest_npcs WHERE npc_id = ${npcId}`;
                await database.execute(questNPCDeleteStatement);
                // Create insert statements
                quests.forEach(async (questId) => {
                    const createQuestNPCStatement = `INSERT INTO quest_npcs
                    (quest_id, npc_id)
                    VALUES (${questId}, ${npcId})`;
                    await database.execute(createQuestNPCStatement);
                });
            }

            // Update relvant npc row
            const updateNPCStatement = `UPDATE npc
            SET name = '${name}', description = '${description}', race = '${race}', disposition = '${disposition}', status = '${status}'
            WHERE id = ${npcId}`;
            await database.execute(updateNPCStatement);

            // Query the relevant data
            const npcQuery = `SELECT * FROM npc WHERE id = ${npcId}`;
            const [npc, _npcField] = await database.execute(npcQuery);

            const npcLocationsQuery = `SELECT location_id AS 'id',
            location.name, latitude, longitude FROM location_npcs
            JOIN npc on npc.id = location_npcs.npc_id
            JOIN location on location.id = location_npcs.location_id
            WHERE npc_id = ${npcId}`;
            const [npcLocationsData, _npcLocationField] =
                await database.execute(npcLocationsQuery);

            // Select only the relevant quests to the new npc
            const npcQuestsQuery = `SELECT quest_id AS 'id',
            quest.name FROM quest_npcs
            JOIN npc on npc.id = quest_npcs.npc_id
            JOIN quest on quest.id = quest_npcs.quest_id
            WHERE npc_id = ${npcId}`;
            const [npcQuestsData, _npcQuestField] = await database.execute(
                npcQuestsQuery
            );

            // Assemble updated npc object
            const npcObject = {
                id: npc[0].id,
                name: npc[0].name,
                description: npc[0].description,
                race: npc[0].race,
                disposition: npc[0].disposition,
                status: npc[0].status,
                updated_at: npc[0].updated_at,
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
