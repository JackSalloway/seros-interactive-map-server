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
    async updateSublocation(sublocationData) {
        try {
            // Create and execute update sublocation statement
            const updateSublocationStatement = `UPDATE sublocation
            SET name = '${sublocationData.name}', description = '${sublocationData.description}'
            WHERE id = ${sublocationData.id}`;
            await database.execute(updateSublocationStatement);

            // Create and execute sublocation select query for new updated sublocation
            const updatedSublocationQuery = `SELECT id, name, description
            FROM sublocation WHERE id = ${sublocationData.id}`;
            const [updatedSublocation, _sublocationField] =
                await database.execute(updatedSublocationQuery);

            return updatedSublocation[0];
        } catch (err) {
            throw err;
        }
    }

    // Delete a sub location
    async deleteSubLocation(sublocationId) {
        try {
            // Create delete statement
            const deleteSublocation = `DELETE FROM sublocation WHERE id = ${sublocationId}`;
            await database.execute(deleteSublocation);
            return;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = SublocationController;
