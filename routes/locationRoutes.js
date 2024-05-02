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
            description: req.body.location_desc,
            region: req.body.location_region,
            latlng: {
                lat: req.body.location_lat,
                lng: req.body.location_lng,
            },
            type: req.body.location_type,
            visited: req.body.location_visited,
            marked: req.body.location_marked,
            sublocations: [],
            campaign_id: req.body.location_campaign_id,
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
            desc: req.body.location_desc,
            region: req.body.location_region,
            latlng: {
                lat: req.body.location_lat,
                lng: req.body.location_lng,
            },
            type: req.body.location_type,
            visited: req.body.location_visited,
            marked: req.body.location_marked,
            sub_locations: req.body.location_sub_locations,
            campaign: req.body.location_campaign_id,
        };
        const controller = new LocationController();
        const locationResult = await controller.updateLocation(
            req.body.location_id,
            updatedLocationContent
        );

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.location_campaign_id,
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

/// SUBLOCATION ROUTES ///

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
            const subLocationResult = await controller.createSubLocation(
                req.body.parent_location_id,
                subLocationContent
            );

            const changelogController = new ChangelogController();
            const changelogResult = await changelogController.updateChangelog(
                req.body.location_campaign_id,
                req.body.username,
                req.body.sub_location_name,
                req.url
            );

            return res.send({ subLocationResult, changelogResult });
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
            const subLocationResult = await controller.updateSubLocation(
                req.body.location_id,
                req.body.sub_location_name,
                req.body.updated_sub_location_name,
                req.body.updated_sub_location_desc
            );

            const changelogController = new ChangelogController();
            const changelogResult = await changelogController.updateChangelog(
                req.body.location_campaign_id,
                req.body.username,
                req.body.updated_sub_location_name,
                req.url
            );

            return res.send({ subLocationResult, changelogResult });
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
        const subLocationResult = await controller.deleteSubLocation(
            req.body.location_id,
            req.body.sub_location_name
        );

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.location_campaign_id,
            req.body.username,
            req.body.sub_location_name,
            req.url
        );
        return res.send({ subLocationResult, changelogResult });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
