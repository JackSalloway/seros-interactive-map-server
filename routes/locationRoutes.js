const express = require("express");
const router = express.Router();
const Validators = require("../helpers/validators");
const LocationController = require("../controllers/locationController");
const NPCController = require("../controllers/npcController");
const QuestController = require("../controllers/questController");
const CombatInstanceController = require("../controllers/combatInstanceController");
const ChangelogController = require("../controllers/changelogController");

/// LOCATION ROUTES ///

// GET request for all map location data
router.get("/location_data", async (req, res) => {
    console.log("location_data hit");
    try {
        const controller = new LocationController();
        const result = await controller.mapData(req.query.campaign_id);
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
            description: req.body.location_description,
            region: req.body.location_region,
            latlng: {
                lat: req.body.location_lat,
                lng: req.body.location_lng,
            },
            type: req.body.location_type,
            visited: req.body.location_visited,
            marked: req.body.location_marked,
            sublocations: [],
            campaignId: req.body.campaign_id,
        };
        const controller = new LocationController();
        const locationResult = await controller.createLocation(locationContent);

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.location_name,
            req.url
        );

        return res.send({
            locationResult,
            changelogResult,
        });
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

// DELETE request to delete a specific location
router.delete("/delete_location", async (req, res) => {
    console.log("delete location hit");
    try {
        // Delete a single location
        const controller = new LocationController();
        await controller.deleteLocation(req.body.location_id);

        // Select all npcs
        const npcController = new NPCController();
        const npcResult = await npcController.npcData(req.body.campaign_id);

        // Select all quests
        const questController = new QuestController();
        const questResult = await questController.questData(
            req.body.campaign_id
        );

        // Select all combat instances
        const combatInstanceController = new CombatInstanceController();
        const combatInstanceResult =
            await combatInstanceController.combatInstanceData(
                req.body.campaign_id
            );

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.location_name,
            req.url
        );

        return res.json({
            npcResult,
            questResult,
            combatInstanceResult,
            changelogResult,
        });
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

// POST request to update a location
router.post("/update_location", ...Validators.location(), async (req, res) => {
    console.log("update location hit");
    const errors = Validators.validateResult(req);
    if (errors !== undefined) {
        return res.status(400).json(errors);
    }

    try {
        const updatedLocationContent = {
            name: req.body.location_name,
            description: req.body.location_description,
            latlng: {
                lat: req.body.location_lat,
                lng: req.body.location_lng,
            },
            type: req.body.location_type,
            visited: req.body.location_visited,
            marked: req.body.location_marked,
            sublocations: req.body.location_sublocations,
            campaign_id: req.body.campaign_id,
        };

        const controller = new LocationController();
        const locationResult = await controller.updateLocation(
            req.body.location_id,
            updatedLocationContent
        );

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.location_name,
            req.url
        );

        return res.send({ locationResult, changelogResult });
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

module.exports = router;
