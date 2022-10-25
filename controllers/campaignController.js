const mongoose = require("mongoose");
const Campaign = require("../models/campaign");
const User = require("../models/user");
const { createAccessToken, createRefreshToken } = require("../helpers/tokens");

//Error imports
const CampaignNoLongerExistsError = require("../errors/campaignErrors/campaignNoLongerExistsError");
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
            return campaign;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = CampaignController;
