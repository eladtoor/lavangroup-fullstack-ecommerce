const SiteStats = require("../models/siteStatsModel");
const cache = require("../utils/responseCache");

const SITE_STATS_TTL = 60 * 1000; // 60s

// Get site stats
exports.getSiteStats = async (req, res) => {
  try {
    // Hit on every homepage render. Single-flight + TTL so a burst of homepage
    // loads shares one findOne instead of each queuing its own behind the loop.
    const stats = await cache.singleFlight("site-stats", SITE_STATS_TTL, () =>
      SiteStats.findOne().lean() // cache a plain object (null cached as "not found")
    );
    if (!stats)
      return res.status(404).json({ message: "Site stats not found" });
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update site stats
exports.updateSiteStats = async (req, res) => {
  try {
    const { clients, supplyPoints, onlineUsers, lastOrderMinutes } = req.body;
    const stats = await SiteStats.findOneAndUpdate(
      {},
      { clients, supplyPoints, onlineUsers, lastOrderMinutes },
      { new: true, upsert: true }
    );
    cache.clear("site-stats"); // reflect the update immediately
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
