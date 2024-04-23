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

    // Create SQL query
    const query = `SELECT user.id AS 'user_id', username, password, refresh_token,
    campaign.id AS 'campaign_id', campaign.name AS 'campaign_name', campaign.description AS 'campaign_description' FROM user
    JOIN campaign_users ON campaign_users.user_id = user.id
    JOIN campaign ON campaign.id = campaign_users.campaign_id
    WHERE user_id = '${payload.userId}'`;

    const user = await database.execute(query);

    // Check username exists
    if (user[0].length === 0) {
        throw new Error("User does not exist within database"); // Username provided does not exist, so user[0] was not populated with query results
    }

    // User exists, check if refresh token exists on user
    if (user[0][0].refresh_token !== token) {
        throw new Error("User token !== cookie token");
    }
    // Create an array of the users campaigns
    const userCampaigns = user[0].map((result) => {
        return {
            campaign_id: result.campaign_id,
            campaign_name: result.campaign_name,
            campaign_description: result.campaign_description,
        };
    });

    // Password matches username, so create Access and Refresh tokens
    const accessToken = createAccessToken(
        user[0][0].user_id,
        user[0][0].username,
        userCampaigns
    );

    const refreshToken = createRefreshToken(user[0][0].user_id);

    const updateUser = `UPDATE user SET refresh_token = '${refreshToken}' WHERE id = '${user[0][0].user_id}'`;

    await database.execute(updateUser);

    return { refreshToken, accessToken };
};

module.exports = {
    refreshTokenFunc,
};
