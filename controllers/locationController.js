const database = require("../services/database");
const he = require("he");

class LocationController {
    // Fetch all location data when the app is started
    async mapData(campaignID) {
        try {
            const locationQuery = `SELECT id, name, description, latitude, longitude, type, visited, marked 
            FROM location WHERE campaign_id = '${campaignID}'`;
            const [locations, _locationField] = await database.execute(
                locationQuery
            );

            const sublocationsQuery = `SELECT sublocation.id AS 'sublocation_id',
            sublocation.name AS 'sublocation_name',
            sublocation.description AS 'sublocation_description',
            sublocation.location_id FROM sublocation
            JOIN location ON location.id = sublocation.location_id
            WHERE campaign_id = '${campaignID}'`;
            const [sublocations, _sublocationField] = await database.execute(
                sublocationsQuery
            );

            const locationData = locations.map((location) => {
                // Create location object
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
                    campaign: {
                        id: campaignID,
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
                region, // Region is not longer needed as it wasn't really used to represent anything
                latlng,
                type,
                visited,
                marked,
                sublocations, // Sublocations is no longer needed as it now has its own tables in the SQL database
                campaign_id,
            } = data;

            // Convert visited and marked values to numbers to satisfy the TINYINT data type in the SQL table
            const visitedBoolean = visited === "true" ? 1 : 0;
            const markedBoolean = marked === "true" ? 1 : 0;

            // Insert new location into the database
            const createLocationStatement = `INSERT INTO location 
            (name, description, latitude, longitude, type, visited, marked, campaign_id)
            VALUES ('${name}', '${description}',
            ${latlng.lat}, ${latlng.lng}, '${type}',
            ${visitedBoolean}, ${markedBoolean}, ${campaign_id});`;
            const [newLocation] = await database.execute(
                createLocationStatement
            );

            // Select only the new location from the database
            const newLocationQuery = `SELECT id, name, description, latitude, longitude, type, visited, marked
            FROM location WHERE id = ${newLocation.insertId}`;
            const [newLocationData, _newLocationField] = await database.execute(
                newLocationQuery
            );

            // Add values that are missing from the query return value to make a default new object
            newLocationData[0].sublocations = [];
            newLocationData[0].latlng = {
                lat: newLocationData[0].latitude,
                lng: newLocationData[0].longitude,
            };
            newLocationData[0].campaign = {
                id: campaign_id,
            };

            // Remove latitude and longitude values from the object as they are redundant now
            delete newLocationData[0].latitude;
            delete newLocationData[0].longitude;

            // Return new location data
            return newLocationData[0];
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

            console.log(updatedNPCList, updatedQuestList);
            return { updatedNPCList, updatedQuestList };
        } catch (err) {
            throw err;
        }
    }

    async updateLocation(locationId, data) {
        try {
            const result = await Location.findOneAndUpdate(
                { _id: locationId },
                { $set: data },
                { new: true }
            )
                .lean()
                .exec();
            return result;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = LocationController;
