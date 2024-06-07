const database = require("../services/database");
const {
    selectQuery,
    insertStatement,
    updateStatement,
    deleteStatement,
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
            const locations = await selectQuery(
                "location",
                locationColumns,
                "campaign_id",
                campaignId
            );

            // Create prepared statement for sublocation query
            const preparedSublocationsQuery = `SELECT sublocation.id AS 'sublocation_id',
            sublocation.name AS 'sublocation_name',
            sublocation.description AS 'sublocation_description',
            sublocation.location_id FROM sublocation
            JOIN location ON location.id = sublocation.location_id WHERE campaign_id = ?`;

            const [sublocations, _sublocationField] = await database.query(
                preparedSublocationsQuery,
                campaignId
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
            const convertedVisited = visited ? 1 : 0;
            const convertedMarked = marked ? 1 : 0;

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

            const [newLocationData, _locationField] = await selectQuery(
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
    async deleteLocation(locationId) {
        try {
            // Create delete statement
            // Because on delete cascade is enabled for all tables that use locationId as a foreign key, any relevant rows will automatically be deleted.
            // Rows from tables that are dropped include: sublocation, npc, quest, combat_instance
            await deleteStatement("location", "id", locationId);
            return;
        } catch (err) {
            throw err;
        }
    }

    // Update a single location and return it
    async updateLocation(locationId, data) {
        try {
            const { name, description, latlng, type, visited, marked } = data;

            // Convert boolean values into numbers to satisfy TINYINT data type in SQL schema
            const visitedBoolean = visited ? 1 : 0;
            const markedBoolean = marked ? 1 : 0;

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
            const [updatedLocation, _locationField] = await selectQuery(
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
