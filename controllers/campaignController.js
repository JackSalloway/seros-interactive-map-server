const mongoose = require("mongoose");
const Campaign = require("../models/campaign");
const User = require("../models/user");
const { createAccessToken, createRefreshToken } = require("../helpers/tokens");

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

            User.findOneAndUpdate(
                { name: username },
                {
                    $push: { campaigns: newCampaignUserData },
                    $set: { refresh_token: refreshToken },
                }
                // { new: true }
            ).exec();

            const accessToken = createAccessToken(
                user.id,
                username,
                user.privileged,
                user.campaigns
            );

            /// NEED THIS CODE TO KEEP USER LOGGED IN THROUGH USE OF COOKIES

            // User.updateOne({ username: username }, {}).exec();
            /// NEED THIS CODE TO KEEP USER LOGGED IN THROUGH USE OF COOKIES

            return {
                accessToken,
                refreshToken,
                returnValue: {
                    username,
                    privileged: user.privileged,
                    campaigns: user.campaigns,
                },
            };
        } catch (err) {
            throw err;
        }
    }
}

module.exports = CampaignController;
