const express = require("express");
const router = express.Router();
const Validators = require("../helpers/validators");
const UserController = require("../controllers/userController");

/// USER ROUTES ///
// POST request to create a new user
router.post("/register", async (req, res) => {
    console.log("register hit");
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        throw new Error("Missing required parameters");
    }

    try {
        const controller = new UserController();
        const result = await controller.register(username, email, password);
        // Is the following line still needed?
        res.cookie("account", result, { maxAge: 60 * 60 * 1000 });
        res.send("User created! Please login!");
    } catch (err) {
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
        sendRefreshToken(res, refreshToken); // Set cookies
        sendAccessToken(req, res, accessToken); // Send response
        res.send(returnValue);
    } catch (err) {
        console.error(err);
        if (err.message === "Incorrect details provided") {
            res.send(
                "Incorrect details provided. Ensure your details are correct."
            );
        }
        // Had to remove to following line, due to the app crashing on a 401 request meaning I cannot let the user know that their login details are incorrect
        // res.status(401).send(err.message);
        res.sendStatus(500);
    }
});

router.get("/logout", (_req, res) => {
    console.log("logout hit");
    res.clearCookie("refresh_token", {
        domain: "jacksalloway.com",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });
    res.clearCookie("access_token", {
        domain: "jacksalloway.com",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });
    res.end();
});

// GET request to check if a user has logged in and their refresh token is still valid
router.get("/startup", async (req, res) => {
    console.log("startup hit");
    // Access and Refresh token already verified in middleware
    // access = req.cookies.access_token;
    // refresh = req.cookies.refresh_token;
    // res.send({ access, refresh });

    try {
        const controller = new UserController();
        const result = await controller.userStartup(req);
        res.send(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// ROUTE NOT NEEDED - JUST USED FOR TESTING
// router.post("/protected", async (req, res) => {
//     try {
//         const userId = authorizeUser(req);
//         if (userId !== null) {
//             res.send({
//                 data: "This is protected data.",
//             });
//         }
//     } catch (err) {
//         console.error(err);
//         res.sendStatus(500);
//     }
// });

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
//         sendRefreshToken(res, refreshToken);
//         // Do I want to call sendAccessToken after this line? I am thinking I do as I need to set the new access token within the cookies to reset the expiry date
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
