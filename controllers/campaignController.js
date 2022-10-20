const Campaign = require("../models/campaign");
const User = require("../models/user");

class CampaignController {
    // Fetch all campaign data when the app is started
    async campaignData() {
        try {
            return await Campaign.find({});
        } catch (err) {
            throw err;
        }
    }
}
