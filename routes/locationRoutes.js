const express = require("express");
const router = express.Router();
const Validators = require("../helpers/validators");
const LocationController = require("../controllers/locationController");
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
            campaignId: req.body.location_campaign_id,
        };
        const controller = new LocationController();
        const locationResult = await controller.createLocation(locationContent);

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.location_campaign_id,
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
        const controller = new LocationController();
        const { updatedNPCList, updatedQuestList } =
            await controller.deleteLocation(
                req.body.location_id,
                req.body.location_campaign_id
            );

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.location_campaign_id,
            req.body.username,
            req.body.location_name,
            req.url
        );

        return res.json({ updatedNPCList, updatedQuestList, changelogResult });
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
