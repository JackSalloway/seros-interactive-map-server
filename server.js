require("dotenv").config();
const app = require("./app");

app.listen(process.env.PORT || 5000, () => {
    if (process.env.PORT !== undefined) {
        console.log(`Server started on ${process.env.PORT}`);
    } else {
        console.log("Server started on port 5000.");
    }
});
