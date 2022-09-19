const User = require("../models/user");
const { createAccessToken, createRefreshToken } = require("../helpers/tokens");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { verify } = require("jsonwebtoken");
const UsernameAlreadyExistsError = require("../errors/usernameAlreadyExistsError");
const EmailAlreadyExistsError = require("../errors/emailAlreadyExistsError");

// Register a new user

class UserController {
    async register(username, email, password) {
        // Validate all fields
        // WILL ADD THESE IN LATER

        // Username field

        // Email field

        // Password field

        // Process request after validation and sanitization

        // See if username already exists

        try {
            // Check if username is already taken
            const dbUsername = await User.findOne({ username: username });
            if (dbUsername) {
                throw new UsernameAlreadyExistsError("Username already exists");
            }

            // Check if email is already taken
            const dbEmail = await User.findOne({ email: email });
            if (dbEmail) {
                throw new EmailAlreadyExistsError("Email already exists");
                // throw new Error("Email already exists");
            }

            // Create new user document with hashed password
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username: username,
                email: email,
                password: hashedPassword,
                privileged: false,
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
            const user = await User.findOne({ username: username });
            if (!user) throw new Error("Incorrect details provided"); // Username provided does not exist
            // User found, so compare crypted password to database password
            const valid = await bcrypt.compare(password, user.password);
            if (!valid) throw new Error("Incorrect details provided"); // Password provided does not match the username
            // Password matches username, so create Access and Refresh tokens
            const accessToken = createAccessToken(
                user.id,
                username,
                user.privileged
            );
            const refreshToken = createRefreshToken(user.id);
            // Put the refresh token in the database
            User.updateOne(
                { username: username },
                { $set: { refresh_token: refreshToken } }
            ).exec();
            // return accessToken and refreshToken
            return {
                accessToken,
                refreshToken,
                returnValue: { username, privileged: user.privileged },
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
