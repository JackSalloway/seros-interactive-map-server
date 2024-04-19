const app = require("./app");
const database = require("./services/database");

// Create initial connection pool to database
database();

app.listen(process.env.PORT || 5000, () => {
    if (process.env.PORT !== undefined) {
        console.log(`Server started on ${process.env.PORT}`);
    } else {
        console.log("Server started on port 5000.");
    }
});
