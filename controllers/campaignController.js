const mongoose = require("mongoose");
const crypto = require("crypto");
const Campaign = require("../models/campaign");
const Invite = require("../models/invite");
const User = require("../models/user");
const { createAccessToken, createRefreshToken } = require("../helpers/tokens");

//Error imports
const CampaignNoLongerExistsError = require("../errors/campaignErrors/campaignNoLongerExistsError");
const InviteDoesNotExistError = require("../errors/inviteErrors/inviteDoesNotExistError");
class CampaignController {
    // Fetch all campaign data when the app is started
    // async campaignData() {
    //     try {
    //         return await Campaign.find({});
    //     } catch (err) {
    //         throw err;
    //     }
    // }
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
            };

            const refreshToken = createRefreshToken(user.id);

            const updatedUser = await User.findOneAndUpdate(
                { name: username },
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
            const campaign = await Campaign.find({
                _id: mongoose.Types.ObjectId(campaignId),
            });
            if (!campaign)
                throw new CampaignNoLongerExistsError(
                    "This campaign no longer exists."
                );
            console.log(campaign);
            const invite = await Invite.find({
                campaign: mongoose.Types.ObjectId(campaignId),
            })
                .populate("campaign")
                .lean()
                .exec();
            return { campaign, invite };
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
            if (!invite) {
                throw new InviteDoesNotExistError("Invite code not valid.");
            }

            // find method seems to return an array, so have to select index 0 of that array
            const campaign = await Campaign.findById(invite[0].campaign);

            const user = await User.findOne({ username: username });

            const refreshToken = createRefreshToken(
                mongoose.Types.ObjectId(user.id)
            );

            const joinCampaignUserData = {
                campaign: campaign._id,
                admin: false,
            };

            // CURRENTLY HAVING ISSUES WITH FINDING THE DOCUMENTS USING THE USERID VALUES - OR JUST ID VALUES IN GENERAL

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
