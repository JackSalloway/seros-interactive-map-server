const database = require("../services/database");
const {
    selectMultipleQuery,
    insertStatement,
    selectSingularQuery,
    updateStatement,
} = require("../helpers/queries");

// Prepare columns for locations - globablly scoped as each method that queries a location will require all the values from these columns
const locationColumns = [
    "id",
    "name",
    "description",
    "latitude",
    "longitude",
    "type",
    "visited",
    "marked",
    "updated_at",
];

class LocationController {
    // Fetch all location data when the app is started
    async mapData(campaignId) {
        try {
            const locations = await selectMultipleQuery(
                "location",
                locationColumns,
                "campaign_id",
                campaignId
            );

            // Create prepared statement for sublocation query
            const preparedSublocationsQuery = `SELECT ?? AS 'sublocation_id',
            ?? AS 'sublocation_name',
            ?? AS 'sublocation_description',
            ?? FROM ??
            JOIN ?? ON ?? = ?? WHERE ?? = ?`;

            const params = [
                "sublocation.id",
                "sublocation.name",
                "sublocation.description",
                "sublocation.location_id",
                "sublocation",
                "location",
                "location.id",
                "sublocation.location_id",
                "campaign_id",
                campaignId,
            ];

            const [sublocations, _sublocationField] = await database.query(
                preparedSublocationsQuery,
                params
            );

            // Create location object for each location and populate it with relevant sublocations
            const locationData = locations.map((location) => {
                let locationObject = {
                    id: location.id,
                    name: location.name,
                    description: location.description,
                    latlng: {
                        lat: location.latitude,
                        lng: location.longitude,
                    },
                    type: location.type,
                    visited: Boolean(location.visited),
                    marked: Boolean(location.marked),
                    sublocations: [],
                    updated_at: location.updated_at,
                    campaign: {
                        id: campaignId,
                    },
                };

                // Assign all relevant sublocations to locationObject
                sublocations.forEach((sublocation) => {
                    // Early return if current sublocation in loop is not related to current location
                    if (sublocation.location_id !== locationObject.id) {
                        return;
                    }

                    // Push sublocation into relevant locationObject
                    locationObject.sublocations.push({
                        id: sublocation.sublocation_id,
                        name: sublocation.sublocation_name,
                        description: sublocation.sublocation_description,
                    });
                });

                return locationObject;
            });

            return locationData;
        } catch (err) {
            throw err;
        }
    }

    // Create a location at specified latlng coordinates
    async createLocation(data) {
        try {
            const {
                name,
                description,
                latlng,
                type,
                visited,
                marked,
                campaignId,
            } = data;

            // Convert visited and marked values to numbers to satisfy the TINYINT data type in the SQL table
            const convertedVisited = visited === "true" ? 1 : 0;
            const convertedMarked = marked === "true" ? 1 : 0;

            const insertLocationColumns = [
                "name",
                "description",
                "latitude",
                "longitude",
                "type",
                "visited",
                "marked",
                "campaign_id",
            ];

            const locationValues = [
                name,
                description,
                latlng.lat,
                latlng.lng,
                type,
                convertedVisited,
                convertedMarked,
                campaignId,
            ];

            const [newLocation] = await insertStatement(
                "location",
                insertLocationColumns,
                locationValues
            );

            const [newLocationData, _locationField] = await selectSingularQuery(
                "location",
                locationColumns,
                "id",
                newLocation.insertId
            );

            // Add values that are missing from the query return value to make a default new object
            newLocationData.sublocations = [];
            newLocationData.latlng = {
                lat: newLocationData.latitude,
                lng: newLocationData.longitude,
            };
            newLocationData.campaign = {
                id: campaignId,
            };

            // Remove latitude and longitude values from the object as they are redundant now
            delete newLocationData.latitude;
            delete newLocationData.longitude;

            // Return new location data
            return newLocationData;
        } catch (err) {
            throw err;
        }
    }

    // Delete a specific location based on id and update any affected npcs/quests
    async deleteLocation(locationId, campaignId) {
        try {
            // Remove references to location from any NPCs that reference it
            await NPC.updateMany(
                { campaign: campaignId },
                {
                    $pull: {
                        associated_locations:
                            mongoose.Types.ObjectId(locationId),
                    },
                }
            );
            // Remove references to location from any NPCs that reference it
            await Quest.updateMany(
                { campaign: campaignId },
                {
                    $pull: {
                        associated_locations:
                            mongoose.Types.ObjectId(locationId),
                    },
                }
            );
            // Delete location
            await Location.findByIdAndDelete(locationId);
            // Retrieve updated NPC list
            const updatedNPCList = await NPC.find({ campaign: campaignId })
                .populate("quests")
                .populate("associated_locations")
                .lean()
                .exec();
            //  Retrieve updated Quest List
            const updatedQuestList = await Quest.find({ campaign: campaignId })
                .populate("associated_locations")
                .lean()
                .exec();

            return { updatedNPCList, updatedQuestList };
        } catch (err) {
            throw err;
        }
    }

    // Update a single location and return it
    async updateLocation(locationId, data) {
        try {
            const { name, description, latlng, type, visited, marked } = data;

            // Convert boolean values into numbers to satisfy TINYINT data type in SQL schema
            const visitedBoolean = visited === "true" ? 1 : 0;
            const markedBoolean = marked === "true" ? 1 : 0;

            const columnsPlusValues = {
                name: name,
                description: description,
                latitude: latlng.lat,
                longitude: latlng.lng,
                type: type,
                visited: visitedBoolean,
                marked: markedBoolean,
            };

            // Update the relevant location
            await updateStatement(
                "location",
                columnsPlusValues,
                "id",
                locationId
            );

            // Select the new updated location
            const [updatedLocation, _locationField] = await selectSingularQuery(
                "location",
                locationColumns,
                "id",
                locationId
            );

            // Create locationObject variable and add values to create a complete location object
            const returnLocation = {
                id: updatedLocation.id,
                name: updatedLocation.name,
                description: updatedLocation.description,
                latlng: {
                    lat: updatedLocation.latitude,
                    lng: updatedLocation.longitude,
                },
                type: updatedLocation.type,
                visited: Boolean(updatedLocation.visited),
                marked: Boolean(updatedLocation.marked),
                sublocations: data.sublocations,
                updated_at: updatedLocation.updated_at,
                campaign: {
                    id: data.campaign_id,
                },
            };

            return returnLocation;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = LocationController;
