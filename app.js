const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const { authorizeUser } = require("./helpers/authorizeUser");
const { refreshTokenFunc } = require("./helpers/refreshToken");

const MissingRequiredEnvVarsError = require("./errors/userErrors/missingRequiredEnvVarsError");
const FailedAuthenticationError = require("./errors/userErrors/failedAuthenticationError.js");

const app = express();

if (
    typeof process.env.MONGODB_URI === "undefined" ||
    typeof process.env.CORS_ORIGIN_URL === "undefined" ||
    typeof process.env.REFRESH_TOKEN_SECRET === "undefined" ||
    typeof process.env.ACCESS_TOKEN_SECRET === "undefined"
) {
    throw new MissingRequiredEnvVarsError(
        "Not all required env vars are set. Please ensure MONGODB_URI, CORS_ORIGIN, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET are set."
    );
}

app.use(morgan("tiny"));

// Route imports
const userRoutes = require("./routes/userRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const locationRoutes = require("./routes/locationRoutes");
// const subLocationRoutes = require("./routes/subLocationRoutes");
const questRoutes = require("./routes/questRoutes");
const npcRoutes = require("./routes/npcRoutes");
const { setAccessToken, setRefreshToken } = require("./helpers/tokens");

// Connect to database
const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(
    cors({
        origin: process.env.CORS_ORIGIN_URL,
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
            // setRefreshToken(res, refreshToken);
            setRefreshToken(res, refreshToken);
            setAccessToken(req, res, accessToken);
            next();
        } catch (err) {
            if (err instanceof FailedAuthenticationError) {
                return res
                    .status(401)
                    .send(
                        "Unable to authenticate. Perhaps your session timed out? Please log in and try again"
                    );
            }
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
    /^(.(?!(location_data|npc_data|quest_data|login|register|logout|startup|campaign_settings|campaign_generate_code)))*$/,
    (req, res, next) => {
        try {
            const userToken = authorizeUser(req);
            if (!userToken.privileged) {
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

app.use(express.json()); // Support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // Support URL-encoded bodies

app.use("/", userRoutes);
app.use("/", campaignRoutes);
app.use("/", locationRoutes);
// app.use("/", subLocationRoutes);
app.use("/", npcRoutes);
app.use("/", questRoutes);

// app.use("/", interactiveMapRouter);

module.exports = app;
