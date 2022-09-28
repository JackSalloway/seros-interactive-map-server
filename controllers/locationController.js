const Location = require("../models/location");
const Quest = require("../models/quest");
const he = require("he");

class LocationController {
    // Fetch all location data when the app is started
    async mapData() {
        try {
            return await Location.find({});
        } catch (err) {
            throw err;
        }
    }

    // Create a location at specified latlng coordinates
    async createLocation(data) {
        try {
            const location = new Location(data);
            await location.save();
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
