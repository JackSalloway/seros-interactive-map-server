const database = require("../services/database");
const crypto = require("crypto");
const { createAccessToken, createRefreshToken } = require("../helpers/tokens");
const { selectQuery } = require("../helpers/queries");

//Error imports
const CampaignNoLongerExistsError = require("../errors/campaignErrors/campaignNoLongerExistsError");
const InviteDoesNotExistError = require("../errors/inviteErrors/inviteDoesNotExistError");
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
    async createCampaign(campaignData, username) {
        try {
            // Find user in database, this could also be done by passing the id as part of the body
            const user = await User.findOne({ username: username });
            const campaign = new Campaign(campaignData);
            await campaign.save();
            const newCampaignUserData = {
                campaign: mongoose.Types.ObjectId(campaign.id),
                admin: true,
                creator: true,
            };

            const refreshToken = createRefreshToken(user.id);

            const updatedUser = await User.findOneAndUpdate(
                { username: username },
                {
                    $push: { campaigns: newCampaignUserData },
                    $set: { refresh_token: refreshToken },
                },
                { new: true }
            )
                .populate("campaigns.campaign")
                .lean()
                .exec();

            const accessToken = createAccessToken(
                updatedUser.id,
                username,
                updatedUser.privileged,
                updatedUser.campaigns
            );

            /// NEED THIS CODE TO KEEP USER LOGGED IN THROUGH USE OF COOKIES

            // User.updateOne({ username: username }, {}).exec();
            /// NEED THIS CODE TO KEEP USER LOGGED IN THROUGH USE OF COOKIES

            console.log(updatedUser);

            return {
                accessToken,
                refreshToken,
                returnValue: {
                    username,
                    privileged: updatedUser.privileged,
                    campaigns: updatedUser.campaigns,
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
            const campaignUsersQuery = `SELECT id, username FROM user
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
            const user = await User.findOne({ username: username });

            await Campaign.findOneAndUpdate(
                { _id: campaignId },
                { $set: data },
                { new: true }
            )
                .lean()
                .exec();

            const refreshToken = createRefreshToken(user.id);

            const updatedUser = await User.findOneAndUpdate(
                {
                    username: username,
                },
                {
                    $set: { refresh_token: refreshToken },
                },
                { new: true }
            )
                .populate("campaigns.campaign")
                .lean()
                .exec();

            const accessToken = createAccessToken(
                updatedUser.id,
                username,
                updatedUser.privileged,
                updatedUser.campaigns
            );
            console.log(updatedUser);

            return {
                accessToken,
                refreshToken,
                returnValue: {
                    username,
                    privileged: updatedUser.privileged,
                    campaigns: updatedUser.campaigns,
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
            const inviteExists = Invite.findOne({
                campaign: mongoose.Types.ObjectId(campaignId),
            });
            if (inviteExists) {
                console.log(
                    "Invite code already exists - no need to create another."
                );
            }
            const inviteCode = crypto.randomUUID();
            const date = new Date();

            const inviteData = {
                code: inviteCode,
                created_at: date,
                campaign: campaignId,
            };

            const invite = new Invite(inviteData);
            await invite.save();
            console.log(inviteData);

            return await Invite.find({ _id: invite._id })
                .populate("campaign")
                .lean()
                .exec();
        } catch (err) {
            throw err;
        }
    }

    async joinCampaign(username, inviteCode) {
        try {
            const invite = await Invite.find({ code: inviteCode })
                .lean()
                .exec();

            // Check if invite code is valid

            console.log(invite);

            if (!invite[0]) {
                throw new InviteDoesNotExistError("Invite code not valid.");
            }

            // find method seems to return an array, so have to select index 0 of that array
            const campaign = await Campaign.findById(invite[0].campaign);

            const user = await User.findOne({ username: username });

            const doesUserHaveCampaign = await User.findOne({
                campaigns: {
                    $elemMatch: {
                        campaign: campaign._id,
                    },
                },
                username: username,
            })
                .lean()
                .exec();

            console.log(doesUserHaveCampaign);

            if (doesUserHaveCampaign) {
                throw new UserAlreadyInCampaignError(
                    "You are already a member of this campaign."
                );
            }

            // console.log(user);

            // const userCurrentCampaigns = user.campaigns.map((campaign) => {
            //     return campaign.campaign;
            // });

            // console.log(invite[0].campaign.toString());
            // userCurrentCampaigns.forEach((campaign) => {
            //     console.log(
            //         campaign.toString(),
            //         "---",
            //         invite[0].campaign.toString()
            //     );
            // });

            // console.log(userCurrentCampaigns);

            // Currently having issues with preventing users from joining the same campaign twice
            // Cannot seem to get a truthy value back from the .every method below. Have also tried .filter
            // Perhaps I will have to use a database find method that searches for users who have the username argument and already have the campaignId value in their campaigns field.

            // console.log(
            //     userCurrentCampaigns.every((id) => {
            //         id.toString() == invite[0].campaign.toString();
            //     })
            // );

            const refreshToken = createRefreshToken(
                mongoose.Types.ObjectId(user.id)
            );

            const joinCampaignUserData = {
                campaign: campaign._id,
                admin: false,
                creator: false,
            };

            const updatedUser = await User.findOneAndUpdate(
                { username: username },
                {
                    $push: { campaigns: joinCampaignUserData },
                    $set: { refresh_token: refreshToken },
                },
                { new: true }
            )
                .populate("campaigns.campaign")
                .lean()
                .exec();

            // console.log("updatedUser: ", updatedUser);

            const accessToken = createAccessToken(
                updatedUser._id,
                updatedUser.username,
                updatedUser.privileged,
                updatedUser.campaigns
            );
            return {
                accessToken,
                refreshToken,
                returnValue: {
                    username: updatedUser.username,
                    privileged: updatedUser.privileged,
                    campaigns: updatedUser.campaigns,
                },
            };
        } catch (err) {
            throw err;
        }
    }
}

module.exports = CampaignController;
