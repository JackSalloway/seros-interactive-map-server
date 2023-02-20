const express = require("express");
const router = express.Router();
const Validators = require("../helpers/validators");
const { setRefreshToken, setAccessToken } = require("../helpers/tokens");
const UserController = require("../controllers/userController");

// Error imports
const MissingRequiredLoginParameters = require("../errors/userErrors/missingRequiredLoginParametersError");
const UsernameAlreadyExistsError = require("../errors/userErrors/usernameAlreadyExistsError");
const EmailAlreadyExistsError = require("../errors/userErrors/emailAlreadyExistsError");
const IncorrectLoginDetailsError = require("../errors/userErrors/incorrectLoginDetailsErrors");
const NoCookiesDetectedError = require("../errors/userErrors/noCookiesDetectedError");

/// USER ROUTES ///
// POST request to create a new user
router.post("/register", async (req, res) => {
    console.log("register hit");
    const { username, email, password } = req.body;

    try {
        const controller = new UserController();
        const result = await controller.register(username, email, password);
        // Is the following line still needed?
        res.cookie("account", result, { maxAge: 60 * 60 * 1000 });
        res.send("User created! Please login!");
    } catch (err) {
        if (err instanceof MissingRequiredLoginParameters) {
            res.status(400).send(
                "Please ensure all login inputs are filled correctly."
            );
            return;
        }
        if (err instanceof UsernameAlreadyExistsError) {
            res.status(400).send(
                "Username already exists. Please choose a different one."
            );
            return;
        }

        if (err instanceof EmailAlreadyExistsError) {
            res.status(400).send(
                "Email is already in use. Please use a different one."
            );
            return;
        }

        console.error(err.message);
        res.sendStatus(500);
    }
});

router.post("/login", async (req, res) => {
    console.log("login hit");
    const { username, password } = req.body;

    try {
        const controller = new UserController();
        const { refreshToken, accessToken, returnValue } =
            await controller.login(username, password);
        setRefreshToken(res, refreshToken); // Set cookies
        setAccessToken(req, res, accessToken); // Send response
        res.send(returnValue);
    } catch (err) {
        console.error(err);
        if (err instanceof IncorrectLoginDetailsError) {
            res.status(400).send(
                "Incorrect details provided. Ensure your details are correct."
            );
            return;
        }
        res.sendStatus(500);
    }
});

router.get("/logout", (_req, res) => {
    console.log("logout hit");

    // For some reason clearing the cookies on a local environment - the domain has to be just 'localhost'
    // Which is different from the env CORS_ORIGIN_URL for a local environment
    // Added in the following work around for this, although I could add another ENV value

    let domainValue = process.env.CORS_ORIGIN_URL;
    if (domainValue.includes("localhost")) {
        domainValue = "localhost";
    }

    res.clearCookie("refresh_token", {
        domain: domainValue,
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });
    res.clearCookie("access_token", {
        domain: domainValue,
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });
    res.end();
});

// GET request to check if a user has logged in and their refresh token is still valid
router.get("/startup", async (req, res) => {
    try {
        console.log("startup hit");
        const controller = new UserController();
        const result = await controller.userStartup(req);
        res.send(result);
    } catch (err) {
        console.log(err);
        // Check if cookies are present
        if (err instanceof NoCookiesDetectedError) {
            res.status(401).send(
                "No cookies detected, please login to view this page."
            );
            return;
        }
        // User JWT has expired
        res.status(401).send(
            "Session timed out, please enter your details to log in again."
        );
        return;
    }
});

// ROUTE NOT NEEDED - JUST USED FOR TESTING
// Get a new access token with a refresh token
// router.post("/refresh_token", async (req, res) => {
//     try {
//         const token = req.cookies.refresh_token;
//         const controller = new UserController();
//         const { refreshToken, accessToken } = await controller.refreshToken(
//             token
//         );
//         if (
//             typeof refreshToken === "undefined" &&
//             accessToken === "undefined"
//         ) {
//             return res.send({ accessToken: "" });
//         }
//         setRefreshToken(res, refreshToken);
//         // Do I want to call setAccessToken after this line? I am thinking I do as I need to set the new access token within the cookies to reset the expiry date
//         return res.send({ accessToken });
//     } catch (err) {
//         const errors = [
//             "Failed due to missing token",
//             "Token failed verification",
//             "User does not exist within database",
//             "User token !== cookie token",
//         ];
//         if (errors.includes(err.message)) {
//             console.error(err.message);
//             return res.send({ accessToken: "" });
//         }
//         res.sendStatus(500);
//     }
// });

// router.get("/user_data", (req, res) => {});

module.exports = router;
