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
        console.log(req.body);

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
// router.post(
//     "/update_sub_location",
//     ...Validators.sublocation(),
//     async (req, res) => {
//         console.log("update_sub_location hit");
//         const errors = Validators.validateResult(req);
//         if (errors !== undefined) {
//             return res.status(400).json(errors);
//         }

//         try {
//             const controller = new LocationController();
//             const subLocationResult = await controller.updateSubLocation(
//                 req.body.location_id,
//                 req.body.sub_location_name,
//                 req.body.updated_sub_location_name,
//                 req.body.updated_sub_location_desc
//             );

//             const changelogController = new ChangelogController();
//             const changelogResult = await changelogController.updateChangelog(
//                 req.body.location_campaign_id,
//                 req.body.username,
//                 req.body.updated_sub_location_name,
//                 req.url
//             );

//             return res.send({ subLocationResult, changelogResult });
//         } catch (err) {
//             console.error(err);
//             res.sendStatus(500);
//         }
//     }
// );

// POST request to delete a sub location from a specific location
// router.post("/delete_sub_location", async (req, res) => {
//     console.log("delete_sub_location hit");
//     try {
//         const controller = new LocationController();
//         const subLocationResult = await controller.deleteSubLocation(
//             req.body.location_id,
//             req.body.sub_location_name
//         );

//         const changelogController = new ChangelogController();
//         const changelogResult = await changelogController.updateChangelog(
//             req.body.location_campaign_id,
//             req.body.username,
//             req.body.sub_location_name,
//             req.url
//         );
//         return res.send({ subLocationResult, changelogResult });
//     } catch (err) {
//         console.error(err);
//         res.sendStatus(500);
//     }
// });

module.exports = router;
