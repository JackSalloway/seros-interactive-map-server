const User = require("../models/user");
const { createAccessToken, createRefreshToken } = require("../helpers/tokens");
const { verify } = require("jsonwebtoken");
const database = require("../services/database");

const FailedAuthenticationError = require("../errors/userErrors/failedAuthenticationError.js");

const refreshTokenFunc = async (token) => {
    console.log("refresh token function hit");
    // If there is no token in the request
    if (!token) {
        throw new Error("Failed due to missing token");
    }
    // There is a token, verify it
    let payload = null;
    try {
        payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new FailedAuthenticationError("Token failed verification");
    }

    // Create user query to check if user exists
    const userQuery = `SELECT * FROM user WHERE id = '${payload.userId}' LIMIT 1`;

    const [userRows, _userField] = await database.execute(userQuery);

    // Check username exists
    if (userRows.length !== 1) {
        throw new Error("User does not exist within database"); // Username provided does not exist, so user[0] was not populated with query results
    }

    // Create user refresh token variable
    const dbUserRefreshToken = userRows[0].refresh_token;

    // User exists, check if refresh token exists on user
    if (dbUserRefreshToken !== token) {
        throw new Error("User token !== cookie token");
    }

    // Create remaining user data variables
    const dbUserID = userRows[0].id;
    const dbUsername = userRows[0].username;

    // Create campaign query to find the users relevant campaigns
    const campaignQuery = `SELECT DISTINCT campaign.id AS 'campaign_id', campaign.name AS 'campaign_name', campaign.description AS 'campaign_description'
    FROM campaign
    JOIN campaign_users on campaign_users.campaign_id = campaign_id
    WHERE campaign_users.user_id = ${dbUserID};`;

    const [campaignRows, _campaignField] = await database.execute(
        campaignQuery
    );

    // Password matches username, so create Access and Refresh tokens
    const accessToken = createAccessToken(dbUserID, dbUsername, campaignRows);

    const refreshToken = createRefreshToken(dbUserID);

    const updateUser = `UPDATE user SET refresh_token = '${refreshToken}' WHERE id = '${dbUserID}'`;

    await database.execute(updateUser);

    return { refreshToken, accessToken };
};

module.exports = {
    refreshTokenFunc,
};
