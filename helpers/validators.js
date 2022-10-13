const { body, validationResult } = require("express-validator");

class Validators {
    // Check if any validators failed
    static validateResult(req) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return { errors: errors.array() };
        }
    }

    // Validation for registering a new account
    static user() {
        //Validate all fields
        // Validate all fields
        return [
            // Username field
            body("username", "Username required.")
                .trim()
                .isString()
                .withMessage("Username must be a string.")
                .isLength({ min: 3 })
                .withMessage("Username must be at least 3 characters.")
                .isLength({ max: 20 })
                .withMessage("Username must not be greater than 20 characters.")
                .escape(),
            // Email field
            body("email", "Email address is required.")
                .trim()
                .isEmail()
                .withMessage("Email must be an email.")
                .escape(),
            // Password field
            body("password", "Password required")
                .trim()
                .isString()
                .withMessage("Password must be a string.")
                .escape(),
        ];
    }

    // Validation for a location that is placed on the map
    static location() {
        // Validate all fields
        return [
            // Name field
            body("location_name", "Location name required.")
                .trim()
                .isString()
                .withMessage("Location name must be a string.")
                .isLength({ min: 1 })
                .withMessage("Location name must be greater than 1 character.")
                .isLength({ max: 75 })
                .withMessage(
                    "Location name must not be greater than 75 characters."
                )
                .escape(),

            // Region field
            body("location_region", "Location region required.")
                .trim()
                .isString()
                .withMessage("Location region must be a string.")
                .escape(),

            // Lat field
            body("location_lat", "Location latitude required.")
                .trim()
                .isNumeric()
                .withMessage("Location latitude must be numeric.")
                .escape(),

            // Lng field
            body("location_lng", "Location longitude required.")
                .trim()
                .isNumeric()
                .withMessage("Location longitude must be numeric.")
                .escape(),

            // Type field
            body("location_type", "Location type required.")
                .trim()
                .isString()
                .withMessage("Location type must be a string.")
                .escape(),

            // Visited field
            body("location_visited", "Location visited status is required.")
                .trim()
                .isBoolean()
                .withMessage("Location visited status must be a boolean.")
                .escape(),

            // Marked field
            body("location_marked", "Location marked status is required.")
                .trim()
                .isBoolean()
                .withMessage("Location marked status must be a boolean.")
                .escape(),

            // Desc field
            body("location_desc", "Location description is required.")
                .trim()
                .isString()
                .withMessage("Location description must be a string.")
                .isLength({ min: 1 })
                .withMessage(
                    "Location description must be at least 1 character."
                )
                .escape(),
        ];
    }

    // Validation for a sub location within a location
    static subLocation() {
        // Validate all fields
        return [
            // Name field
            body("sub_location_name", "Sub location name required.")
                .trim()
                .isString()
                .withMessage("Sub location name must be a string.")
                .isLength({ min: 1 })
                .withMessage(
                    "Sub location name must be greater than 1 character."
                )
                .isLength({ max: 75 })
                .withMessage(
                    "Sub location name must not be greater than 75 characters."
                )
                .escape(),

            // Desc field
            body("sub_location_desc", "Sub location description is required.")
                .trim()
                .isString()
                .withMessage("Sub location description must be a string.")
                .isLength({ min: 1 })
                .withMessage(
                    "Location description must be at least 1 character."
                )
                .escape(),
        ];
    }

    // Validation for an npc
    static npc() {
        // Validate all fields
        return [
            // NPC name
            body("npc_name", "NPC name required.")
                .trim()
                .isString()
                .withMessage("NPC name must be a string.")
                .escape(),

            // NPC race
            body("npc_race", "NPC race required")
                .trim()
                .isString()
                .withMessage("NPC race must be a string")
                .escape(),

            // NPC desc
            body("npc_desc", "NPC description is required.")
                .trim()
                .isString()
                .withMessage("NPC description must be a string.")
                .isLength({ min: 1 })
                .withMessage("NPC description must be at least 1 character")
                .escape(),

            // NPC disposition
            body("npc_disposition", "NPC disposition is required.")
                .trim()
                .isString()
                .withMessage("NPC disposition must be a string.")
                .escape(),

            // NPC disposition
            body("npc_status", "NPC status is required.")
                .trim()
                .isString()
                .withMessage("NPC status must be a string.")
                .escape(),

            // NPC associated locations
            body("npc_associated_locations.*", "Invalid location provided.")
                .trim()
                .isString()
                .withMessage("Location values must be a string.")
                .optional({ nullable: true })
                .escape(),

            // NPC quests
            body("npc_quests.*", "Invalid quest provided.")
                .trim()
                .isString()
                .withMessage("Each quest must be a string")
                .optional({ nullable: true, checkFalsy: true })
                .escape(),
        ];
    }

    // Validation for a quest
    static quest() {
        // Validate all fields
        return [
            // Name field
            body("quest_name", "Quest name required.")
                .trim()
                .isString()
                .withMessage("Quest name must be a string.")
                .isLength({ min: 1 })
                .withMessage("Quest name must be at least 1 character.")
                .escape(),

            // Desc field
            body("quest_desc", "Quest description is required.")
                .trim()
                .isString()
                .withMessage("Quest description must be a string.")
                .isLength({ min: 1 })
                .withMessage("Quest description must be at least 1 character.")
                .escape(),

            // This check was causing an error which for some reason trimmed the quest_associated_locations array down to a single string.
            // Associated locations field
            body("quest_associated_locations.*", "Invalid location provided.")
                .trim()
                .isString()
                .withMessage("Each associated location must be a string.")
                .escape(),

            // Completed field
            body("quest_completed", "Quest completed status is required.")
                .trim()
                .isBoolean()
                .withMessage("Quest completed status must be a boolean value.")
                .escape(),
        ];
    }
}

module.exports = Validators;
