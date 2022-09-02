require("dotenv").config();

const { sign } = require("jsonwebtoken");

const createAccessToken = (userId, username, privilege) => {
    return sign(
        { userId, username, privilege },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "15m",
        }
    );
};

const createRefreshToken = (userId) => {
    return sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
};

const sendAccessToken = (req, res, accessToken) => {
    res.cookie("access_token", accessToken, {
        httpOnly: true,
    });
};

const sendRefreshToken = (res, refreshToken) => {
    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        // path: "/refresh_token",
    });
};

module.exports = {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
};
