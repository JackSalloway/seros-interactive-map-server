const express = require("express");
const router = express.Router();
const Validators = require("../helpers/validators");
const SublocationController = require("../controllers/sublocationController");
const ChangelogController = require("../controllers/changelogController");

// POST request to add a sub location to a specific location
router.post(
    "/create_sublocation",
    ...Validators.sublocation(),
    async (req, res) => {
        console.log("create_sublocation hit");
        const errors = Validators.validateResult(req);
        if (errors !== undefined) {
            return res.status(400).json(errors);
        }

        try {
            // Create new sublocation controller and call createSublocation method
            const controller = new SublocationController();
            const sublocationResult = await controller.createSublocation(
                req.body.parent_location_id,
                req.body.sublocation_name,
                req.body.sublocation_description
            );

            // Create new changelog controller and call updateChangelog method
            const changelogController = new ChangelogController();
            const changelogResult = await changelogController.updateChangelog(
                req.body.campaign_id,
                req.body.username,
                req.body.sublocation_name,
                req.url
            );

            return res.send({ sublocationResult, changelogResult });
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    }
);

// POST request to update a sub location at a specific location
router.post(
    "/update_sub_location",
    ...Validators.sublocation(),
    async (req, res) => {
        console.log("update_sub_location hit");
        const errors = Validators.validateResult(req);
        if (errors !== undefined) {
            return res.status(400).json(errors);
        }

        try {
            const sublocationData = {
                id: req.body.sublocation_id,
                name: req.body.sublocation_name,
                description: req.body.sublocation_description,
            };

            const controller = new SublocationController();
            const sublocationResult = await controller.updateSublocation(
                sublocationData
            );

            const changelogController = new ChangelogController();
            const changelogResult = await changelogController.updateChangelog(
                req.body.campaign_id,
                req.body.username,
                req.body.sublocation_name,
                req.url
            );

            return res.send({ sublocationResult, changelogResult });
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    }
);

// POST request to delete a sub location from a specific location
router.post("/delete_sublocation", async (req, res) => {
    console.log("delete_sublocation hit");
    try {
        const controller = new SublocationController();
        await controller.deleteSubLocation(req.body.sublocation_id);

        const changelogController = new ChangelogController();
        const changelogResult = await changelogController.updateChangelog(
            req.body.campaign_id,
            req.body.username,
            req.body.sublocation_name,
            req.url
        );

        return res.send({
            sublocation_id: req.body.sublocation_id,
            changelogResult,
        });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
