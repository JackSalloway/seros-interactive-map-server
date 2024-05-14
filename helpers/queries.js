const database = require("../services/database");

// Generate string for columns
const generateColumnString = (columns) => {
    return new Array(columns.length).fill("??").join(", ");
};

// Generate string for values
const generateValueString = (values) => {
    return new Array(values.length).fill("?").join(", ");
};

// Generate string for update statement - this is required due to the syntax of an update statment SET columnName = value
const generateUpdateStatementString = (columnsPlusValues) => {
    const preparedOrderArray = [];
    const preparedString = [];
    for (const [columnName, rowValue] of Object.entries(columnsPlusValues)) {
        preparedOrderArray.push(columnName, rowValue);
        preparedString.push("?? = ?");
    }
    return { preparedOrderArray, preparedString: preparedString.join(", ") };
};

// Select specific rows from a singular table
const selectMultipleQuery = async (
    table,
    columns,
    conditionRow,
    conditionValue
) => {
    const query = `SELECT 
    ${generateColumnString(columns)}
    FROM ?? WHERE ?? = ?`;

    const params = [...columns, table, conditionRow, conditionValue];

    const [rows, _field] = await database.query(query, params);
    return rows;
};

// Select a single row from a singular table
const selectSingularQuery = async (
    table,
    columns,
    conditionRow,
    conditionValue
) => {
    const query = `SELECT 
    ${generateColumnString(columns)}
    FROM ?? WHERE ?? = ?`;

    const params = [...columns, table, conditionRow, conditionValue];

    const [row, _field] = await database.query(query, params);
    return row;
};

const insertStatement = async (table, columns, values) => {
    const query = `INSERT INTO ??
    (${generateColumnString(columns)})
    VALUES (${generateValueString(values)})`;

    const params = [table, ...columns, ...values];

    return await database.query(query, params);
};

const updateStatement = async (
    table,
    columnsPlusValues,
    conditionRow,
    conditionValue
) => {
    const { preparedOrderArray, preparedString } =
        generateUpdateStatementString(columnsPlusValues);

    const query = `UPDATE ??
    SET ${preparedString}
    WHERE ?? = ?`;

    const params = [table, ...preparedOrderArray, conditionRow, conditionValue];

    await database.query(query, params);
    return;
};

module.exports = {
    selectMultipleQuery,
    selectSingularQuery,
    insertStatement,
    updateStatement,
};
