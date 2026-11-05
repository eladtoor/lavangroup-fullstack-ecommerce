const mongoose = require("mongoose");

/**
 * Lead — a contact request left on the site (technical consultation, soil testing,
 * real estate in Poland / Germany). Stored for follow-up and, only with explicit consent,
 * for future marketing. One document per submission.
 */
const LEAD_SOURCES = ["consult", "drilling", "poland", "germany", "general"];
const LEAD_STATUSES = ["new", "in_progress", "done", "irrelevant"];

const leadSchema = new mongoose.Schema(
  {
    source: { type: String, enum: LEAD_SOURCES, required: true, index: true },
    status: { type: String, enum: LEAD_STATUSES, default: "new", index: true },

    // Contact details
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 40, default: "" },
    email: { type: String, trim: true, lowercase: true, maxlength: 160, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    customerType: { type: String, trim: true, maxlength: 60, default: "" },

    // What they asked about
    topic: { type: String, trim: true, maxlength: 120, default: "" },
    interests: { type: [String], default: [] },
    product: { type: String, trim: true, maxlength: 200, default: "" },
    quantity: { type: String, trim: true, maxlength: 80, default: "" },
    budget: { type: String, trim: true, maxlength: 80, default: "" },
    timeframe: { type: String, trim: true, maxlength: 80, default: "" },
    message: { type: String, trim: true, maxlength: 2000, default: "" },

    // Consent (privacy is required to submit; marketing is optional and recorded with its time)
    privacyConsent: { type: Boolean, required: true },
    marketingConsent: { type: Boolean, default: false, index: true },
    marketingConsentAt: { type: Date, default: null },

    // Attribution
    pagePath: { type: String, trim: true, maxlength: 300, default: "" },
    utm: {
      source: { type: String, trim: true, maxlength: 80, default: "" },
      medium: { type: String, trim: true, maxlength: 80, default: "" },
      campaign: { type: String, trim: true, maxlength: 120, default: "" },
    },

    // Internal follow-up
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    emailNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Lead", leadSchema);
module.exports.LEAD_SOURCES = LEAD_SOURCES;
module.exports.LEAD_STATUSES = LEAD_STATUSES;
