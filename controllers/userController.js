const User = require("../models/user");
const { createAccessToken, createRefreshToken } = require("../helpers/tokens");
const database = require("../services/database");
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
            // Check if username is already taken
            const dbUsername = await User.findOne({ username: username });
            if (dbUsername) {
                throw new UsernameAlreadyExistsError("Username already exists");
            }

            // Check if email is already taken
            const dbEmail = await User.findOne({ email: email });
            if (dbEmail) {
                throw new EmailAlreadyExistsError("Email already exists");
            }

            // Create new user document with hashed password
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username: username,
                email: email,
                password: hashedPassword,
                privileged: false,
                campaigns: [],
            });

            await newUser.save();
            console.log("POST request recieved: register");
            return { username: newUser.username, email: newUser.email };
        } catch (err) {
            throw err;
        }
    }

    async login(username, password, privileged) {
        // Validate all fields
        // WILL ADD THESE IN LATER

        // Username field

        // Password field

        // Process request after validation and sanitization

        try {
            // Find user within database
            // Create SQL query
            const query = `SELECT user.id AS 'user_id', username, password, refresh_token,
            campaign.id AS 'campaign_id', campaign.name AS 'campaign_name', campaign.description AS 'campaign_description' FROM user
            JOIN campaign_users ON campaign_users.user_id = user.id
            JOIN campaign ON campaign.id = campaign_users.campaign_id
            WHERE username = '${username}'`;

            const user = await database.execute(query);

            // Check for username exists
            if (user[0].length === 0) {
                throw new IncorrectLoginDetailsError(
                    "Incorrect details provided"
                ); // Username provided does not exist, so user[0] was not populated with query results
            }

            // User found, so compare crypted password to database password
            const valid = await bcrypt.compare(password, user[0][0].password);
            if (!valid)
                throw new IncorrectLoginDetailsError(
                    "Incorrect details provided"
                ); // Password provided does not match the username

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

            // Put the refresh token in the database
            const updateUser = `UPDATE user SET refresh_token = '${refreshToken}' WHERE id = '${user[0][0].user_id}'`;

            await database.execute(updateUser);

            // return accessToken, refreshToken and userData
            return {
                accessToken,
                refreshToken,
                returnValue: {
                    username,
                    campaigns: userCampaigns,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    async refreshToken(token) {
        // If there is no token in the request
        if (!token) {
            throw new Error("Failed due to missing token");
        }
        // There is a token, verify it
        let payload = null;
        try {
            payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            throw new Error("Token failed verification");
        }
        // Token is valid, check if user exists
        const user = await User.findOne({ _id: payload.userId });
        // User does not exist
        if (!user) {
            throw new Error("User does not exist within database");
        }
        // User exists, check if refresh token exists on user
        if (user.refresh_token !== token) {
            throw new Error("User token !== cookie token");
        }
        // Token exists, create new refresh and access tokens
        const accessToken = createAccessToken(
            user.id,
            user.username,
            user.privileged
        );
        const refreshToken = createRefreshToken(user.id);
        // Update refresh token value on the database
        User.updateOne(
            { _id: payload.userId },
            { $set: { refresh_token: refreshToken } }
        ).exec();
        // All checks passed, send new refresh and access tokens
        return { refreshToken, accessToken };
    }

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
