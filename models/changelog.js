const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ChangelogSchema = new Schema({
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    changes: [
        {
            username: { type: String, required: true, minLength: 3 },
            operation: { type: String, required: true },
            data_type_affected: { type: String, required: true },
            created_at: { type: Date, default: Date.now },
        },
    ],
});

// Export model
module.exports = mongoose.model("Changelog", ChangelogSchema);
