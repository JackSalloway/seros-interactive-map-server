const database = require("../services/database");
const crypto = require("crypto");
const { createAccessToken, createRefreshToken } = require("../helpers/tokens");
const {
    selectQuery,
    insertStatement,
    updateStatement,
    deleteStatement,
} = require("../helpers/queries");

//Error imports
const CampaignNoLongerExistsError = require("../errors/campaignErrors/campaignNoLongerExistsError");
const InviteDoesNotExistError = require("../errors/inviteErrors/inviteDoesNotExistError");
const InviteExpiredError = require("../errors/inviteErrors/inviteExpiredError");
const UserAlreadyInCampaignError = require("../errors/campaignErrors/userAlreadyInCampaignError");
class CampaignController {
    // Return all relevant players
    async campaignPlayers(campaignId) {
        try {
            // Create a query for finding all relevant players
            const playersQuery = `SELECT ??, ??, ??
            FROM ?? WHERE ?? = ? AND ?? = ?`;

            const params = [
                "id",
                "name",
                "class",
                "player",
                "campaign_id",
                campaignId,
                "is_real",
                1,
            ];

            const [players, _playerField] = await database.query(
                playersQuery,
                params
            );

            return players;
        } catch (err) {
            throw err;
        }
    }

    // Create a new campaign and assign the creator as an admin
    async createCampaign(campaignData, userData) {
        try {
            // Create a new campaign in the database
            const [newCampaign] = await insertStatement(
                "campaign",
                ["name", "description"],
                [campaignData.name, campaignData.description]
            );

            // Create a new campaign_players row and set them as an admin
            const [newCampaignUser] = await insertStatement(
                "campaign_users",
                ["campaign_id", "user_id", "is_admin"],
                [newCampaign.insertId, userData.id, 1]
            );

            // Create new refresh token and update the user row
            const refreshToken = createRefreshToken(userData.id);
            await updateStatement(
                "user",
                { refresh_token: refreshToken },
                "id",
                userData.id
            );

            // Create campaign query to find the users relevant campaigns
            const userCampaignQuery = `SELECT id, name, description, is_admin
            FROM campaign JOIN campaign_users ON campaign_users.campaign_id = id
            WHERE campaign_users.user_id = ?`;

            const [campaignRows, _campaignField] = await database.query(
                userCampaignQuery,
                userData.id
            );

            const accessToken = createAccessToken(
                userData.id,
                userData.username,
                campaignRows
            );

            return {
                accessToken,
                refreshToken,
                returnValue: {
                    username: userData.username,
                    campaigns: campaignRows,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    // Fetch all data on a campaign and return it in a campaignSettings object for the user.
    async campaignSettings(campaignId) {
        try {
            // Fetch campaign data - id, name, description, created_at, updated_at
            const columns = [
                "id",
                "name",
                "description",
                "created_at",
                "updated_at",
            ];
            const campaignResult = await selectQuery(
                "campaign",
                columns,
                "id",
                campaignId
            );
            const campaign =
                campaignResult.length > 0 ? campaignResult[0] : null;

            // Fetch all the usernames of the users in the campaign - id, username
            const campaignUsersQuery = `SELECT id, username, is_admin FROM user
            JOIN campaign_users ON campaign_users.user_id = user.id
            WHERE campaign_users.campaign_id = ?`;
            const [campaignUsers, _campaignUsersFields] = await database.query(
                campaignUsersQuery,
                campaignId
            );

            // Find an invite that has been created for the campaign and is still in use - code
            const campaignInvitesQuery = `SELECT code FROM invite WHERE campaign_id = ? AND expires_at > NOW()`;
            const [inviteResult, _inviteFields] = await database.query(
                campaignInvitesQuery,
                campaignId
            );
            const campaignInvite =
                inviteResult.length > 0 ? inviteResult[0] : null;

            return { campaign, campaignInvite, campaignUsers };
        } catch (err) {
            throw err;
        }
    }

    async updateCampaign(campaignId, data, username) {
        try {
            // Select user from database
            const userQuery = `SELECT id, username FROM user WHERE username = ?`;
            const [userResult, _userField] = await database.query(
                userQuery,
                username
            );
            const user = userResult.length > 0 ? userResult[0] : null;

            // Update campaign values
            await updateStatement(
                "campaign",
                {
                    name: data.name,
                    description: data.description,
                },
                "id",
                campaignId
            );

            // Create refresh token and update user value in the database
            const refreshToken = createRefreshToken(user.id);
            await updateStatement(
                "user",
                { refresh_token: refreshToken },
                "id",
                user.id
            );

            // Create campaign query to find the users relevant campaigns
            const userCampaignQuery = `SELECT id, name, description, is_admin
            FROM campaign JOIN campaign_users ON campaign_users.campaign_id = id
            WHERE campaign_users.user_id = ?`;

            const [campaignRows, _campaignField] = await database.query(
                userCampaignQuery,
                user.id
            );

            const accessToken = createAccessToken(
                user.id,
                user.username,
                campaignRows
            );

            return {
                accessToken,
                refreshToken,
                returnValue: {
                    username: username,
                    // privileged: updatedUser.privileged,
                    campaigns: campaignRows,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    async updateCampaignPlayers(campaignId, playerData) {
        try {
            const addNewPlayer = await Campaign.findOneAndUpdate(
                { _id: campaignId },
                { $push: { players: playerData } },
                { new: true }
            )
                .lean()
                .exec();

            return addNewPlayer;
        } catch (err) {
            throw err;
        }
    }

    async campaignCreateInviteCode(campaignId) {
        try {
            // Check if there is already a valid invite
            const [inviteExists] = await database.query(
                `SELECT * FROM invite WHERE expires_at > NOW()`
            );
            const existingInvite =
                inviteExists.length > 0 ? inviteExists[0] : null;

            let invite = {};

            if (existingInvite !== null) {
                // Valid invite found
                invite = inviteExists[0];
            } else {
                // No valid invite found, so create a new one
                const inviteCode = crypto.randomUUID();
                const [insertNewInvite] = await database.query(
                    `INSERT INTO invite(code, campaign_id) VALUES (?, ?)`,
                    [inviteCode, campaignId]
                );
                const [newInvite] = await database.query(
                    `SELECT * FROM invite WHERE id = ?`,
                    insertNewInvite.insertId
                );
                invite = newInvite[0];
            }

            return invite;
        } catch (err) {
            throw err;
        }
    }

    async joinCampaign(user, inviteCode) {
        try {
            // Select the invite from the code provided
            const [checkInvite] = await database.query(
                `SELECT * FROM invite WHERE code = ?`,
                inviteCode
            );
            const invite = checkInvite.length > 0 ? checkInvite[0] : null;

            // Check if invite code exists in the database
            if (invite === null) {
                throw new InviteDoesNotExistError("Invite code invalid.");
            }

            // Check the expiry date of the invite code against current timestamp
            const dateToCheck = new Date(invite.expired_at);
            const now = new Date();

            if (dateToCheck < now) {
                throw new InviteExpiredError("Invite code expired.");
            }

            // Check if the user is already in that campaign
            const [campaignUser] = await database.query(
                `SELECT * FROM campaign_users WHERE campaign_id = ? AND user_id = ?`,
                [invite.campaign_id, user.id]
            );

            const userInCampaign =
                campaignUser.length > 0 ? campaignUser[0] : null;

            if (userInCampaign !== null) {
                throw new UserAlreadyInCampaignError(
                    "You are already a member of that campaign."
                );
            }

            // Insert new campaign_user row to add user to this campaign
            await insertStatement(
                "campaign_users",
                ["campaign_id", "user_id", "is_admin"],
                [invite.campaign_id, user.id, 0]
            );

            // Create refresh token and update user value in the database
            const refreshToken = createRefreshToken(user.id);
            await updateStatement(
                "user",
                { refresh_token: refreshToken },
                "id",
                user.id
            );

            // Create campaign query to find the users relevant campaigns
            const userCampaignQuery = `SELECT id, name, description, is_admin
            FROM campaign JOIN campaign_users ON campaign_users.campaign_id = id
            WHERE campaign_users.user_id = ?`;

            const [campaignRows, _campaignField] = await database.query(
                userCampaignQuery,
                user.id
            );

            const accessToken = createAccessToken(
                user.id,
                user.username,
                campaignRows
            );

            return {
                accessToken,
                refreshToken,
            };
        } catch (err) {
            throw err;
        }
    }

    async getDataCounts(campaignId) {
        try {
            // Query the amount of locations
            const [locations] = await database.query(
                "SELECT COUNT(*) AS count FROM location WHERE campaign_id = ?",
                campaignId
            );
            const locationCount = locations.length > 0 ? locations[0].count : 0;

            // Query the amount of npcs
            const [npcs] = await database.query(
                `SELECT COUNT(*) AS count FROM npc WHERE campaign_id = ?`,
                campaignId
            );
            const npcCount = npcs.length > 0 ? npcs[0].count : 0;

            // Query the amount of quests
            const [quests] = await database.query(
                `SELECT COUNT(*) AS count from quest WHERE campaign_id = ?`,
                campaignId
            );
            const questCount = quests.length > 0 ? quests[0].count : 0;

            // QUERY INSTANCES COUNT
            const [instances] = await database.query(
                `SELECT COUNT(*) AS count FROM combat_instance
                JOIN location ON location.id = combat_instance.location_id
                WHERE campaign_id = ?`,
                campaignId
            );
            const instanceCount = instances.length > 0 ? instances[0].count : 0;

            return { locationCount, npcCount, questCount, instanceCount };
        } catch (err) {
            throw err;
        }
    }

    async deleteCampaign(campaignId, user) {
        console.log(campaignId, user);

        // Create delete statement
        await deleteStatement("campaign", "id", campaignId);

        // // Create refresh token and update user value in the database
        const refreshToken = createRefreshToken(user.id);
        await updateStatement(
            "user",
            { refresh_token: refreshToken },
            "id",
            user.id
        );

        // Create campaign query to find the users relevant campaigns
        const userCampaignQuery = `SELECT id, name, description, is_admin
        FROM campaign JOIN campaign_users ON campaign_users.campaign_id = id
        WHERE campaign_users.user_id = ?`;

        const [campaignRows, _campaignField] = await database.query(
            userCampaignQuery,
            user.id
        );

        const accessToken = createAccessToken(
            user.id,
            user.username,
            campaignRows
        );

        return {
            accessToken,
            refreshToken,
            returnValue: {
                username: user.username,
                campaigns: campaignRows,
            },
        };
    }
}

module.exports = CampaignController;
