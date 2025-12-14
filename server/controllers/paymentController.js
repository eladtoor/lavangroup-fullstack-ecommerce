const fetch = require("node-fetch");

const createPayment = async (req, res) => {
  try {
    const requestData = req.body; // קבלת הנתונים מה-Frontend

    console.log("📤 Sending payment request to iCredit:", JSON.stringify(requestData, null, 2));

    const response = await fetch(
      "https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    const contentType = response.headers.get("content-type");
    const responseText = await response.text();

    console.log("📥 iCredit response content-type:", contentType);
    console.log("📥 iCredit response body:", responseText);

    let data;

    // Check if response is JSON or XML
    if (contentType && contentType.includes("application/json")) {
      data = JSON.parse(responseText);
    } else if (contentType && (contentType.includes("xml") || contentType.includes("text/html"))) {
      // Handle XML response (likely an error from iCredit)
      console.error("❌ Received XML/HTML response instead of JSON:", responseText);
      return res.status(400).json({
        success: false,
        error: "תגובה לא תקינה משרת התשלום",
        details: "iCredit returned XML instead of JSON. Check request format and credentials.",
        rawResponse: responseText.substring(0, 500), // First 500 chars for debugging
      });
    } else {
      // Try to parse as JSON anyway
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse response:", responseText);
        return res.status(500).json({
          success: false,
          error: "תגובה לא תקינה משרת התשלום",
          details: parseError.message,
          rawResponse: responseText.substring(0, 500),
        });
      }
    }

    if (data.Status === 0 && data.URL) {
      res.json({
        success: true,
        paymentUrl: data.URL,
        salePrivateToken: data.PrivateSaleToken, // ✅ חשוב!
      });
    } else {
      res.status(400).json({
        success: false,
        error: "שגיאה בקבלת URL לתשלום",
        details: data,
      });
    }
  } catch (error) {
    console.error("❌ שגיאה ביצירת התשלום:", error);
    res
      .status(500)
      .json({ success: false, error: "שגיאה בשרת", details: error.message });
  }
};
const verifyPayment = async (req, res) => {
  try {
    const response = await fetch(
      "https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/Verify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};
const getSaleDetails = async (req, res) => {
  try {
    const response = await fetch(
      "https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/SaleDetails",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("❌ Error retrieving SaleDetails:", error);
    res.status(500).json({ error: "Failed to retrieve SaleDetails" });
  }
};

module.exports = { createPayment, verifyPayment, getSaleDetails };
