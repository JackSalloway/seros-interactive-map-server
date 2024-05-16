const { createAccessToken, createRefreshToken } = require("../helpers/tokens");
const database = require("../services/database");
const { insertStatement } = require("../helpers/queries");
const bcrypt = require("bcryptjs");
const { verify } = require("jsonwebtoken");

// Error imports
const UsernameAlreadyExistsError = require("../errors/userErrors/usernameAlreadyExistsError");
const EmailAlreadyExistsError = require("../errors/userErrors/emailAlreadyExistsError");
const MissingRequiredLoginParametersError = require("../errors/userErrors/missingRequiredLoginParametersError");
const IncorrectLoginDetailsError = require("../errors/userErrors/incorrectLoginDetailsErrors");

// Register a new user

class UserController {
    async register(username, email, password) {
        try {
            // Check if missing any parameters
            if (!username || !email || !password) {
                throw new MissingRequiredLoginParametersError(
                    "Missing required login parameters"
                );
            }

            // Create sql query for finding a specific user to check if username provided is available
            const usernameQuery = `SELECT ?? FROM ?? WHERE ?? = ? LIMIT 1`;
            const usernameParams = ["username", "user", "username", username];
            const dbUsername = await database.query(
                usernameQuery,
                usernameParams
            );

            if (dbUsername[0].length !== 0) {
                throw new UsernameAlreadyExistsError("Username already exists");
            }

            // Create sql query for finding a specific email to check if email provided is available
            const emailQuery = `SELECT ?? FROM ?? WHERE ?? = ? LIMIT 1`;
            const emailParams = ["email", "user", "email", email];
            const dbEmail = await database.query(emailQuery, emailParams);
            if (dbEmail[0].length !== 0) {
                throw new EmailAlreadyExistsError("Email already exists");
            }

            // Username and email provided are not taken so continue
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new row for user and campaign_user tables
            const insertUserColumns = ["username", "password", "email"];
            const userValues = [username, hashedPassword, email];
            await insertStatement("user", insertUserColumns, userValues);

            return { username: username, email: email };
        } catch (err) {
            throw err;
        }
    }

    async login(username, password) {
        // Validate all fields
        // WILL ADD THESE IN LATER

        // Username field

        // Password field

        // Process request after validation and sanitization

        try {
            // Find user within database

            // Create user query to check if user exists
            const userQuery = `SELECT * FROM user WHERE username = '${username}' LIMIT 1`;

            const [userRows, _userField] = await database.execute(userQuery);

            // Check username exists
            if (userRows.length !== 1) {
                throw new IncorrectLoginDetailsError(
                    "Incorrect details provided"
                ); // Username provided does not exist, so user[0] was not populated with query results
            }

            // Destructure user values
            const dbUserID = userRows[0].id;
            const dbUsername = userRows[0].username;
            const dbPassword = userRows[0].password;

            // User found, so compare crypted password to database password
            const valid = await bcrypt.compare(password, dbPassword);
            if (!valid)
                throw new IncorrectLoginDetailsError(
                    "Incorrect details provided"
                ); // Password provided does not match the username

            // Create campaign query to find the users relevant campaigns
            const campaignQuery = `SELECT DISTINCT campaign.id AS 'campaign_id', campaign.name AS 'campaign_name', campaign.description AS 'campaign_description'
            FROM campaign
            JOIN campaign_users on campaign_users.campaign_id = campaign_id
            WHERE campaign_users.user_id = ${dbUserID};`;

            const [campaignRows, _campaignField] = await database.execute(
                campaignQuery
            );

            // Password matches username, so create Access and Refresh tokens
            const accessToken = createAccessToken(
                dbUserID,
                dbUsername,
                campaignRows
            );
            const refreshToken = createRefreshToken(dbUserID);

            // Put the refresh token in the database
            const updateUser = `UPDATE user SET refresh_token = '${refreshToken}' WHERE id = '${dbUserID}'`;

            await database.execute(updateUser);

            // return accessToken, refreshToken and userData
            return {
                accessToken,
                refreshToken,
                returnValue: {
                    username,
                    campaigns: campaignRows,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    // async refreshToken(token) {
    //     // If there is no token in the request
    //     if (!token) {
    //         throw new Error("Failed due to missing token");
    //     }
    //     // There is a token, verify it
    //     let payload = null;
    //     try {
    //         payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
    //     } catch (err) {
    //         throw new Error("Token failed verification");
    //     }
    //     // Token is valid, check if user exists
    //     const user = await User.findOne({ _id: payload.userId });
    //     // User does not exist
    //     if (!user) {
    //         throw new Error("User does not exist within database");
    //     }
    //     // User exists, check if refresh token exists on user
    //     if (user.refresh_token !== token) {
    //         throw new Error("User token !== cookie token");
    //     }
    //     // Token exists, create new refresh and access tokens
    //     const accessToken = createAccessToken(
    //         user.id,
    //         user.username,
    //         user.privileged
    //     );
    //     const refreshToken = createRefreshToken(user.id);
    //     // Update refresh token value on the database
    //     User.updateOne(
    //         { _id: payload.userId },
    //         { $set: { refresh_token: refreshToken } }
    //     ).exec();
    //     // All checks passed, send new refresh and access tokens
    //     return { refreshToken, accessToken };
    // }

    async userStartup(req) {
        if (!req.cookies.access_token) {
            return {};
        }
        return verify(
            req.cookies.access_token,
            process.env.ACCESS_TOKEN_SECRET
        );
    }
}

module.exports = UserController;
