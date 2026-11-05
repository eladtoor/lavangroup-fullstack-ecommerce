const nodemailer = require("nodemailer");
const Lead = require("../models/leadModel");
const { LEAD_SOURCES, LEAD_STATUSES } = require("../models/leadModel");

const SOURCE_LABELS = {
  consult: "ייעוץ טכני",
  drilling: "פיתוח וקידוח – בדיקות קרקע",
  poland: "נדל״ן בפולין",
  germany: "נדל״ן בגרמניה",
  general: "פנייה כללית",
};

const STATUS_LABELS = { new: "חדשה", in_progress: "בטיפול", done: "טופלה", irrelevant: "לא רלוונטית" };

// Alerts go to the inbox that receives the site's orders (GMAIL_USER), unless overridden.
const notifyAddress = () => process.env.LEADS_NOTIFY_EMAIL || process.env.GMAIL_USER;

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-()]{6,}$/;

/** Validate and normalise a public submission. Returns { data } or { error }. */
function parseLead(body = {}) {
  // Honeypot: real visitors never see or fill this field.
  if (str(body.website, 200)) return { spam: true };

  const source = LEAD_SOURCES.includes(body.source) ? body.source : "general";
  const name = str(body.name, 120);
  const phone = str(body.phone, 40);
  const email = str(body.email, 160).toLowerCase();

  if (name.length < 2) return { error: "נא למלא שם" };
  if (!phone && !email) return { error: "נא למלא טלפון או אימייל" };
  if (phone && !PHONE_RE.test(phone)) return { error: "מספר הטלפון אינו תקין" };
  if (email && !EMAIL_RE.test(email)) return { error: "כתובת האימייל אינה תקינה" };
  if (body.privacyConsent !== true) return { error: "יש לאשר את מדיניות הפרטיות" };

  const marketingConsent = body.marketingConsent === true;
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((x) => typeof x === "string").map((x) => x.trim().slice(0, 80)).slice(0, 10)
    : [];
  const utm = body.utm && typeof body.utm === "object" ? body.utm : {};

  return {
    data: {
      source,
      name,
      phone,
      email,
      city: str(body.city, 80),
      customerType: str(body.customerType, 60),
      topic: str(body.topic, 120),
      interests,
      product: str(body.product, 200),
      quantity: str(body.quantity, 80),
      budget: str(body.budget, 80),
      timeframe: str(body.timeframe, 80),
      message: str(body.message, 2000),
      privacyConsent: true,
      marketingConsent,
      marketingConsentAt: marketingConsent ? new Date() : null,
      pagePath: str(body.pagePath, 300),
      utm: { source: str(utm.source, 80), medium: str(utm.medium, 80), campaign: str(utm.campaign, 120) },
    },
  };
}

function leadEmail(lead) {
  const rows = [
    ["מקור", SOURCE_LABELS[lead.source] || lead.source],
    ["שם", lead.name],
    ["טלפון", lead.phone],
    ["אימייל", lead.email],
    ["עיר / מיקום", lead.city],
    ["סוג לקוח", lead.customerType],
    ["תחום", lead.topic],
    ["תחומי עניין", (lead.interests || []).join(", ")],
    ["מוצר", lead.product],
    ["כמות", lead.quantity],
    ["תקציב", lead.budget],
    ["מועד", lead.timeframe],
    ["הודעה", lead.message],
    ["הסכמה לדיוור", lead.marketingConsent ? "כן" : "לא"],
    ["עמוד", lead.pagePath],
    ["UTM", [lead.utm?.source, lead.utm?.medium, lead.utm?.campaign].filter(Boolean).join(" / ")],
  ].filter(([, v]) => v);

  const html = `
<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 640px; color: #111827;">
  <h2 style="margin: 0 0 12px;">פנייה חדשה מהאתר – ${escapeHtml(SOURCE_LABELS[lead.source] || lead.source)}</h2>
  <table style="border-collapse: collapse; width: 100%;">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; white-space: nowrap; vertical-align: top;">${escapeHtml(
            k
          )}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; white-space: pre-wrap;">${escapeHtml(v)}</td></tr>`
      )
      .join("")}
  </table>
  <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">כל הפניות נמצאות בפאנל הניהול, בלשונית "פניות".</p>
</div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  return { html, text };
}

async function sendLeadAlert(lead) {
  const to = notifyAddress();
  if (!to || !process.env.GMAIL_USER || !process.env.GMAIL_PASS) return false;
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
  const { html, text } = leadEmail(lead);
  await transporter.sendMail({
    from: `"Lavan Group – פניות" <${process.env.GMAIL_USER}>`,
    to,
    replyTo: lead.email || undefined,
    subject: `פנייה חדשה: ${SOURCE_LABELS[lead.source] || lead.source} – ${lead.name}`,
    text,
    html,
  });
  return true;
}

// POST /api/leads (public)
const createLead = async (req, res) => {
  const parsed = parseLead(req.body);
  // Answer bots exactly like a success, without storing anything.
  if (parsed.spam) return res.status(201).json({ ok: true });
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const lead = await Lead.create(parsed.data);
    res.status(201).json({ ok: true });

    // Email after responding, so a slow or failing mail server never blocks the visitor.
    sendLeadAlert(lead)
      .then((sent) => (sent ? Lead.updateOne({ _id: lead._id }, { emailNotified: true }) : null))
      .catch((err) => console.error("[LEADS] email alert failed:", err.message));
  } catch (err) {
    console.error("[LEADS] create failed:", err.message);
    res.status(500).json({ error: "שגיאה בשליחת הפנייה. נא לנסות שוב או להתקשר 050-5342813" });
  }
};

// GET /api/leads (admin) ?source=&status=&marketing=1
const listLeads = async (req, res) => {
  const filter = {};
  if (LEAD_SOURCES.includes(req.query.source)) filter.source = req.query.source;
  if (LEAD_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.marketing === "1") filter.marketingConsent = true;
  try {
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(1000).lean();
    res.json(leads);
  } catch (err) {
    console.error("[LEADS] list failed:", err.message);
    res.status(500).json({ error: "Failed to load leads" });
  }
};

// PATCH /api/leads/:id (admin) { status?, notes? }
const updateLead = async (req, res) => {
  const update = {};
  if (LEAD_STATUSES.includes(req.body?.status)) update.status = req.body.status;
  if (typeof req.body?.notes === "string") update.notes = req.body.notes.slice(0, 2000);
  if (!Object.keys(update).length) return res.status(400).json({ error: "Nothing to update" });
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(400).json({ error: "Invalid lead id" });
  }
};

// GET /api/leads/export.csv (admin) — same filters as listLeads; opens in Excel (UTF-8 BOM)
const exportLeadsCsv = async (req, res) => {
  const filter = {};
  if (LEAD_SOURCES.includes(req.query.source)) filter.source = req.query.source;
  if (LEAD_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.marketing === "1") filter.marketingConsent = true;
  try {
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
    const cols = [
      ["תאריך", (l) => {
        const d = l.createdAt ? new Date(l.createdAt) : null;
        return d && !isNaN(d) ? d.toISOString().slice(0, 16).replace("T", " ") : "";
      }],
      ["מקור", (l) => SOURCE_LABELS[l.source] || l.source],
      ["סטטוס", (l) => STATUS_LABELS[l.status] || l.status],
      ["שם", (l) => l.name],
      ["טלפון", (l) => l.phone],
      ["אימייל", (l) => l.email],
      ["עיר", (l) => l.city],
      ["סוג לקוח", (l) => l.customerType],
      ["תחום", (l) => l.topic],
      ["תחומי עניין", (l) => (l.interests || []).join(" | ")],
      ["מוצר", (l) => l.product],
      ["כמות", (l) => l.quantity],
      ["תקציב", (l) => l.budget],
      ["מועד", (l) => l.timeframe],
      ["הודעה", (l) => l.message],
      ["הסכמה לדיוור", (l) => (l.marketingConsent ? "כן" : "לא")],
      ["UTM מקור", (l) => l.utm?.source],
      ["UTM קמפיין", (l) => l.utm?.campaign],
      ["הערות", (l) => l.notes],
    ];
    // Quote every cell; neutralise spreadsheet formulas (=, +, -, @) from user input.
    const cell = (v) => {
      let s = v == null ? "" : String(v);
      if (/^[=+\-@]/.test(s)) s = "'" + s;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [cols.map(([h]) => cell(h)).join(","), ...leads.map((l) => cols.map(([, f]) => cell(f(l))).join(","))].join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send("﻿" + csv);
  } catch (err) {
    console.error("[LEADS] export failed:", err.message);
    res.status(500).json({ error: "Export failed" });
  }
};

module.exports = { createLead, listLeads, updateLead, exportLeadsCsv, parseLead };
