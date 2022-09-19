const { sign } = require("jsonwebtoken");

const createAccessToken = (userId, username, privileged) => {
    return sign(
        { userId, username, privileged },
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
    const options = {
        maxAge: 60 * 60 * 1000 * 24 * 30,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
    };

    if (process.env.NODE_ENV === "production") {
        options.domain = "jacksalloway.com";
    }

    res.cookie("access_token", accessToken, options);
};

const sendRefreshToken = (res, refreshToken) => {
    const options = {
        maxAge: 60 * 60 * 1000 * 24 * 30,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
    };

    if (process.env.NODE_ENV === "production") {
        options.domain = "jacksalloway.com";
    }

    res.cookie("refresh_token", refreshToken, options);
};

module.exports = {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
};
