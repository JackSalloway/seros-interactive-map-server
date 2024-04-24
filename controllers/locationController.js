const database = require("../services/database");
const he = require("he");

class LocationController {
    // Fetch all location data when the app is started
    async mapData(campaignId) {
        try {
            const locationQuery = `SELECT id, name, description, latitude, longitude, type, visited, marked FROM location WHERE campaign_id = '${campaignId}'`;
            return await database.execute(locationQuery);
        } catch (err) {
            throw err;
        }
    }

    // Create a location at specified latlng coordinates
    async createLocation(data) {
        try {
            const location = new Location(data);
            await location.save();
            return Location.findOne({ _id: location.id }).lean().exec();
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

    // Get all data for a specific location
    // async getSpecificLocation(locationId) {
    //     try {
    //         return await Quest.find({
    //             associated_locations: { $all: [locationId] },
    //         }).populate("associated_locations");
    //     } catch (err) {
    //         throw err;
    //     }
    // }

    // Create a new sub location
    async createSubLocation(parentId, newSubLocation) {
        try {
            const result = await Location.findOneAndUpdate(
                { _id: parentId },
                {
                    $push: { sub_locations: newSubLocation },
                },
                { new: true }
            )
                .lean()
                .exec();

            return result;
        } catch (err) {
            throw err;
        }
    }

    // Update a sub location
    async updateSubLocation(
        parentId,
        subLocationName,
        updatedSubLocationName,
        updatedSubLocationDesc
    ) {
        try {
            const result = await Location.findOneAndUpdate(
                {
                    _id: parentId,
                    "sub_locations.name": he.decode(subLocationName),
                },
                {
                    $set: {
                        "sub_locations.$.name": updatedSubLocationName,
                        "sub_locations.$.desc": updatedSubLocationDesc,
                    },
                },
                { new: true }
            )
                .lean()
                .exec();
            return result;
        } catch (err) {
            throw err;
        }
    }

    // Delete a sub location
    async deleteSubLocation(parentId, subLocationName) {
        try {
            const result = await Location.findOneAndUpdate(
                { _id: parentId },
                {
                    $pull: {
                        sub_locations: { name: subLocationName },
                    },
                },
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
