const database = require("../services/database");
const he = require("he");

class SublocationController {
    // Create a new sub location
    async createSublocation(parentId, name, description) {
        try {
            // Create statement to insert new sublocation into the database
            const createSublocationStatement = `INSERT INTO sublocation
            (name, description, location_id)
            VALUES ('${name}', '${description}', ${parentId});`;
            const [newSublocation] = await database.execute(
                createSublocationStatement
            );

            // Select only the new sublocation from the database
            const newSublocationQuery = `SELECT * FROM sublocation WHERE id = ${newSublocation.insertId}`;
            const [newSublocationData, _sublocationField] =
                await database.execute(newSublocationQuery);

            return newSublocationData[0];
        } catch (err) {
            throw err;
        }
    }

    // Update a sub location
    // async updateSubLocation(
    //     parentId,
    //     subLocationName,
    //     updatedSubLocationName,
    //     updatedSubLocationDesc
    // ) {
    //     try {
    //         const result = await Location.findOneAndUpdate(
    //             {
    //                 _id: parentId,
    //                 "sub_locations.name": he.decode(subLocationName),
    //             },
    //             {
    //                 $set: {
    //                     "sub_locations.$.name": updatedSubLocationName,
    //                     "sub_locations.$.desc": updatedSubLocationDesc,
    //                 },
    //             },
    //             { new: true }
    //         )
    //             .lean()
    //             .exec();
    //         return result;
    //     } catch (err) {
    //         throw err;
    //     }
    // }

    // Delete a sub location
    // async deleteSubLocation(parentId, subLocationName) {
    //     try {
    //         const result = await Location.findOneAndUpdate(
    //             { _id: parentId },
    //             {
    //                 $pull: {
    //                     sub_locations: { name: subLocationName },
    //                 },
    //             },
    //             { new: true }
    //         )
    //             .lean()
    //             .exec();
    //         return result;
    //     } catch (err) {
    //         throw err;
    //     }
    // }
}

module.exports = SublocationController;
