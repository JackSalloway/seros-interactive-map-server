const {
    insertStatement,
    selectQuery,
    updateStatement,
    deleteStatement,
} = require("../helpers/queries");

const sublocationColumns = [
    "id",
    "name",
    "description",
    "updated_at",
    "location_id",
];

class SublocationController {
    // Create a new sub location
    async createSublocation(parentId, name, description) {
        try {
            const insertSublocationColumns = [
                "name",
                "description",
                "location_id",
            ];

            const insertSublocationValues = [name, description, parentId];

            // Insert new sublocation into the database
            const [newSublocation] = await insertStatement(
                "sublocation",
                insertSublocationColumns,
                insertSublocationValues
            );

            // Select the new sublocation from the database
            const [newSublocationData, _sublocationField] = await selectQuery(
                "sublocation",
                sublocationColumns,
                "id",
                newSublocation.insertId
            );

            return newSublocationData;
        } catch (err) {
            throw err;
        }
    }

    // Update a sub location
    async updateSublocation(sublocationData) {
        try {
            const { name, description, id } = sublocationData;

            const columnsPlusValues = {
                name: name,
                description: description,
            };

            // Update the relevant location
            await updateStatement("sublocation", columnsPlusValues, "id", id);

            const [updatedSublocation, _sublocationField] = await selectQuery(
                "sublocation",
                sublocationColumns,
                "id",
                id
            );

            return updatedSublocation;
        } catch (err) {
            throw err;
        }
    }

    // Delete a sub location
    async deleteSubLocation(sublocationId) {
        try {
            // Create delete statement
            await deleteStatement("sublocation", "id", sublocationId);
            return;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = SublocationController;
