const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ChangelogSchema = new Schema({
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    changes: [
        {
            username: { type: String, required: true, minLength: 3 },
            operation_type: { type: String, required: true },
            data_name: { type: String, required: true },
            data_affected: { type: String, required: true },
            created_at: { type: Date, default: Date.now },
        },
    ],
});

// Export model
module.exports = mongoose.model("Changelog", ChangelogSchema);
