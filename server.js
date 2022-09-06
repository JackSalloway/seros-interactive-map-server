const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const { authorizeUser } = require("./helpers/authorizeUser");
const { refreshTokenFunc } = require("./helpers/refreshToken");

const app = express();

app.use(morgan("tiny"));

// Route imports
const interactiveMapRouter = require("./routes/interactiveMap");
const { sendAccessToken, sendRefreshToken } = require("./helpers/tokens");

// Connect to database
const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// app.use(cors());

app.use(
    cors({
        origin: "https://seros.jacksalloway.com/",
        credentials: true,
    })
);

app.use(cookieParser());

// Refresh access token expiry if refresh token is still valid
app.use(
    /^(.(?!(location_data|npc_data|quest_data|login|register|logout)))*$/,
    async (req, res, next) => {
        try {
            const token = req.cookies.refresh_token;
            const { refreshToken, accessToken } = await refreshTokenFunc(token);
            if (
                typeof refreshToken === "undefined" &&
                accessToken === "undefined"
            ) {
                return res.send({ accessToken: "" });
            }
            // sendRefreshToken(res, refreshToken);
            sendRefreshToken(res, refreshToken);
            sendAccessToken(req, res, accessToken);
            next();
        } catch (err) {
            if (err.message === "Failed due to missing token") {
                // User was not signed in and has no cookies so no fail response status required.
                return next();
                // res.sendStatus(204)
            }
            console.error(err.message);
            res.sendStatus(500);
        }
    }
);

// Authorize user by veryfying JWT
app.use(
    /^(.(?!(location_data|npc_data|quest_data|login|register|logout|startup)))*$/,
    (req, res, next) => {
        try {
            const userToken = authorizeUser(req);
            if (!userToken.privilege) {
                console.error("User not privileged");
                return res.sendStatus(401);
            }
            req.userToken = userToken;
            next();
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    }
);

// Think the following line can also be done by using this: app.use(express.json) - At least that is what I keep seeing people do
app.use(bodyParser.json()); // Support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // Support URL-encoded bodies

app.use("/", interactiveMapRouter);

app.listen(process.env.PORT || 5000, () => {
    if (process.env.PORT !== undefined) {
        console.log("Server started on heroku.");
    } else {
        console.log("Server started on port 5000.");
    }
});
