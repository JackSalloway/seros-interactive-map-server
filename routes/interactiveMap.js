const express = require("express");
const router = express.Router();

// Require helper modules
const Validators = require("../helpers/validators");
const { sendAccessToken, sendRefreshToken } = require("../helpers/tokens");
const { authorizeUser } = require("../helpers/authorizeUser");

// Require controller modules
const UserController = require("../controllers/userController");
const LocationController = require("../controllers/locationController");
const NPCController = require("../controllers/npcController");
const QuestController = require("../controllers/questController");

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
        res.status(200).send("User created! Please login!");
    } catch (err) {
        if (err.message === "Username already exists") {
            res.status(401).send(
                "Username already exists. Please choose a different one."
            );
            return;
        }

        if (err.message === "Email already exists") {
            res.status(401).send(
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
        res.status(401).send(err.message);
        // res.sendStatus(500);
    }
});

router.post("/logout", (_req, res) => {
    console.log("logout hit");
    res.clearCookie("refresh_token");
    res.clearCookie("access_token");
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

/// LOCATION ROUTES ///

// GET request for all map location data
router.get("/location_data", async (_req, res) => {
    console.log("location_data hit");
    try {
        const controller = new LocationController();
        const result = await controller.mapData();
        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

// POST request to create new location
router.post("/create_location", ...Validators.location(), async (req, res) => {
    console.log("create location hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }

    try {
        const locationContent = {
            name: req.body.location_name,
            desc: req.body.location_desc,
            region: req.body.location_region,
            latlng: {
                lat: req.body.location_lat,
                lng: req.body.location_lng,
            },
            type: req.body.location_type,
            visited: req.body.location_visited,
            marked: req.body.location_marked,
            sub_locations: [],
        };
        const controller = new LocationController();
        const result = await controller.createLocation(locationContent);
        return res.send(result);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

// Don't actually think this request is being used
// GET request for specific location data
// router.post("/location/:location_id", async (req, res) => {
//     try {
//         const controller = new LocationController();
//         const result = await controller.getSpecificLocation(
//             req.params.location_id
//         );
//         return res.send(result);
//     } catch (err) {
//         console.error(err.message);
//         res.sendStatus(500);
//     }
// });

// POST request to add a sub location to a specific location
router.post(
    "/create_sub_location",
    ...Validators.subLocation(),
    async (req, res) => {
        console.log("create_sub_location hit");
        const errors = Validators.validateResult(req);
        if (errors !== undefined) {
            return res.status(400).json(errors);
        }

        try {
            const subLocationContent = {
                name: req.body.sub_location_name,
                desc: req.body.sub_location_desc,
            };
            const controller = new LocationController();
            const result = await controller.createSubLocation(
                req.body.parent_location_id,
                subLocationContent
            );
            return res.send(result);
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    }
);

// POST request to update a sub location at a specific location
router.post(
    "/update_sub_location",
    ...Validators.subLocation(),
    async (req, res) => {
        console.log("update_sub_location hit");
        const errors = Validators.validateResult(req);
        if (errors !== undefined) {
            return res.status(400).json(errors);
        }

        try {
            const controller = new LocationController();
            const result = await controller.updateSubLocation(
                req.body.location_id,
                req.body.sub_location_name,
                req.body.updated_sub_location_name,
                req.body.updated_sub_location_desc
            );
            return res.send(result);
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    }
);

// POST request to delete a sub location from a specific location
router.post("/delete_sub_location", async (req, res) => {
    console.log("delete_sub_location hit");
    try {
        const controller = new LocationController();
        const result = await controller.deleteSubLocation(
            req.body.location_id,
            req.body.sub_location_name
        );
        return res.send(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

/// NPC ROUTES ///

/// GET request for all NPC data
router.get("/npc_data", async (req, res) => {
    console.log("npc_data hit");
    try {
        const controller = new NPCController();
        const result = await controller.npcData(req.body.npc_quests);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// POST request to create a new friendly npc
router.post("/create_npc", ...Validators.npc(), async (req, res) => {
    console.log("create_npc hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }
    let importance = null;
    if (req.body.npc_quests.length === 0) {
        importance = false;
    } else {
        importance = true;
    }
    const npcContent = {
        name: req.body.npc_name,
        race: req.body.npc_race,
        desc: req.body.npc_desc,
        disposition: req.body.npc_disposition,
        important: importance,
        associated_locations: req.body.npc_associated_locations,
        quests: req.body.npc_quests,
    };
    try {
        const controller = new NPCController();
        const result = await controller.createNPC(npcContent);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// DELETE request to delete a specific npc
router.delete("/delete_npc", async (req, res) => {
    console.log("delete_npc hit");
    try {
        const controller = new NPCController();
        const result = await controller.deleteNPC(req.body.data_id);
        return res.send(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// Post request to update a specific npc
router.post("/update_npc", ...Validators.npc(), async (req, res) => {
    console.log("update_npc hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }
    try {
        let importance = null;
        if (req.body.npc_quests.length === 0) {
            importance = false;
        } else {
            importance = true;
        }
        const updatedNPCContent = {
            name: req.body.npc_name,
            race: req.body.npc_race,
            desc: req.body.npc_desc,
            disposition: req.body.npc_disposition,
            important: importance,
            associated_locations: req.body.npc_associated_locations,
            quests: req.body.npc_quests,
        };
        const controller = new NPCController();
        const result = await controller.updateNPC(
            req.body.npc_id,
            updatedNPCContent
        );
        return res.send(result);
    } catch (err) {
        console.err(err);
        res.sendStatus(500);
    }
});

/// QUEST-ROUTES ///

// GET request for all quest data
router.get("/quest_data", async (req, res) => {
    console.log("quest_data hit");
    try {
        const controller = new QuestController();
        const result = await controller.questData();
        res.json(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// POST request to create new quest
router.post("/create_quest", ...Validators.quest(), async (req, res) => {
    console.log("create_quest hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }
    try {
        const questContent = {
            name: req.body.quest_name,
            desc: req.body.quest_desc,
            completed: req.body.quest_completed,
            associated_locations: req.body.quest_associated_locations,
        };
        const controller = new QuestController();
        const result = await controller.createQuest(questContent);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// POST request to delete a quest and remove any instances where NPCs reference it
router.post("/delete_quest", async (req, res) => {
    console.log("delete_quest hit");
    try {
        const controller = new QuestController();
        const result = await controller.deleteQuest(req.body.data_id);
        return res.json(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// POST request to update a quest
router.post("/update_quest", ...Validators.quest(), async (req, res) => {
    console.log("update_quest hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }
    try {
        const updatedQuestContent = {
            name: req.body.quest_name,
            desc: req.body.quest_desc,
            completed: req.body.quest_completed,
            associated_locations: req.body.quest_associated_locations,
        };
        const controller = new QuestController();
        const result = await controller.updateQuest(
            req.body.quest_id,
            updatedQuestContent
        );
        return res.json(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
