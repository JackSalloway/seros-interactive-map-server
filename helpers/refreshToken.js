const User = require("../models/user");
const { createAccessToken, createRefreshToken } = require("../helpers/tokens");
const { verify } = require("jsonwebtoken");
const mongoose = require("mongoose");

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
    // Token is valid, check if user exists
    const user = await User.findOne({ _id: payload.userId }).populate(
        "campaigns.campaign"
    );
    // User does not exist
    if (!user) {
        throw new Error("User does not exist within database");
    }
    // User exists, check if refresh token exists on user
    if (user.refresh_token !== token) {
        console.log(user.refresh_token);
        console.log(token);
        throw new Error("User token !== cookie token");
    }
    // Token exists, create new refresh and access tokens
    const accessToken = createAccessToken(
        user.id,
        user.username,
        user.privileged,
        user.campaigns
    );
    const refreshToken = createRefreshToken(user.id);
    // Update refresh token value on the database
    User.updateOne(
        { _id: payload.userId },
        { $set: { refresh_token: refreshToken } }
    ).exec();
    // All checks passed, send new refresh and access tokens
    return { refreshToken, accessToken };
};

module.exports = {
    refreshTokenFunc,
};
