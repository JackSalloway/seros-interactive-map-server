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

const sendAccessToken = (_req, res, accessToken) => {
    res.cookie("access_token", accessToken, {
        maxAge: 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/",
    });
};

const sendRefreshToken = (res, refreshToken) => {
    res.cookie("refresh_token", refreshToken, {
        maxAge: 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/",
    });
};

module.exports = {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
};
