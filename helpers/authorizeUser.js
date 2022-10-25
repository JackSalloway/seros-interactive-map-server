const { verify } = require("jsonwebtoken");

const authorizeUser = (req) => {
    console.log("authorize user hit");
    console.log(req.cookies);

    const token = req.cookies.access_token;
    if (!token) throw new Error("You need to log in");
    const userToken = verify(token, process.env.ACCESS_TOKEN_SECRET);
    return userToken;
};

module.exports = {
    authorizeUser,
};
