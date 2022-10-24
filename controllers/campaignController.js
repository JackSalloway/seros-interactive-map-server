const mongoose = require("mongoose");
const Campaign = require("../models/campaign");
const User = require("../models/user");
const {
    // createAccessToken,
    createRefreshToken,
} = require("../helpers/tokens");

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
            const campaign = new Campaign(campaignData);
            await campaign.save();
            const newCampaignUserData = {
                campaign: mongoose.Types.ObjectId(campaign.id),
                admin: true,
            };
            const updatedUser = User.findOneAndUpdate(
                { name: username },
                { $push: { campaigns: newCampaignUserData } },
                { new: true }
            )
                .lean()
                .exec();

            /// NEED THIS CODE TO KEEP USER LOGGED IN THROUGH USE OF COOKIES
            const user = await User.findOne({ username: username }).populate(
                "campaigns.campaign"
            );

            const refreshToken = createRefreshToken(user.id);

            User.updateOne(
                { username: username },
                { $set: { refresh_token: refreshToken } }
            ).exec();
            /// NEED THIS CODE TO KEEP USER LOGGED IN THROUGH USE OF COOKIES

            return {
                // accessToken,
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
