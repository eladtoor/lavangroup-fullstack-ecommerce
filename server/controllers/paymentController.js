const fetch = require("node-fetch");
const Product = require("../models/productModel");
const MaterialGroupSettings = require("../models/materialGroupSettingsModel");
const admin = require("../config/firebase");

/**
 * Price tolerance for floating point comparison (0.5 = 50 agorot)
 */
const PRICE_TOLERANCE = 0.5;

/**
 * Crane unload fixed fee
 */
const CRANE_UNLOAD_FEE = 250;

/**
 * VAT rate
 */
const VAT_RATE = 0.18;

/**
 * Parse variation attributes from item description
 * Description format: "Product Name : Attr1: Value1 | Attr2: Value2"
 */
const parseAttributesFromDescription = (description) => {
  if (!description || !description.includes(":")) return {};

  const attributes = {};
  // Split by " : " to separate product name from attributes
  const parts = description.split(" : ");
  if (parts.length < 2) return {};

  // Get attributes part (everything after product name)
  const attrPart = parts.slice(1).join(" : ");
  // Split by " | " to get individual attributes
  const attrPairs = attrPart.split(" | ");

  attrPairs.forEach((pair) => {
    const [key, value] = pair.split(": ").map((s) => s?.trim());
    if (key && value) {
      attributes[key] = value;
    }
  });

  return attributes;
};

/**
 * Calculate expected price for a product with variations and user discount
 */
const calculateExpectedPrice = (product, selectedAttributes, userProductDiscount) => {
  // Base price (sale price takes priority)
  let price = product["מחיר מבצע"] || product["מחיר רגיל"] || 0;

  // Add variation attribute prices
  if (product.variations && product.variations.length > 0 && Object.keys(selectedAttributes).length > 0) {
    product.variations.forEach((variation) => {
      if (variation.attributes) {
        Object.entries(variation.attributes).forEach(([attrName, attrData]) => {
          // Check if this attribute was selected
          const selectedValue = selectedAttributes[attrName];
          if (selectedValue && attrData && attrData.value === selectedValue && attrData.price) {
            price += Number(attrData.price) || 0;
          }
        });
      }
    });
  }

  // Apply user-specific product discount
  if (userProductDiscount > 0) {
    price = price * (1 - userProductDiscount / 100);
  }

  return Math.round(price * 100) / 100; // Round to 2 decimal places
};

/**
 * Validate cart items against database prices with EXACT calculation
 *
 * Validates:
 * 1. Each product price (base + attributes - user discount)
 * 2. Cart discount matches agent's cartDiscount percentage
 * 3. Shipping costs match material group rules
 * 4. Crane fee is correct (₪250 or ₪0)
 * 5. VAT is 18% of pre-VAT total
 *
 * Returns { valid: boolean, message: string, details: object }
 */
const validateCartPrices = async (items, userId) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { valid: false, message: "No items provided" };
  }

  try {
    // Separate product items from service items
    const productItems = [];
    let submittedShipping = 0;
    let submittedCraneUnload = 0;
    let submittedCartDiscount = 0;
    let submittedVAT = 0;

    for (const item of items) {
      const catalogNum = item.CatalogNumber?.toUpperCase() || "";

      if (catalogNum.includes("SHIPPING")) {
        submittedShipping = item.UnitPrice || 0;
      } else if (catalogNum.includes("CRANE_UNLOAD")) {
        submittedCraneUnload = item.UnitPrice || 0;
      } else if (catalogNum.includes("CART_DISCOUNT") || catalogNum.includes("DISCOUNT")) {
        submittedCartDiscount = item.UnitPrice || 0; // Should be negative
      } else if (catalogNum.includes("VAT") || catalogNum.includes("SUMMARY_VAT")) {
        submittedVAT = item.UnitPrice || 0;
      } else {
        productItems.push(item);
      }
    }

    // Fetch user data from Firestore (for product discounts and referral)
    let userProductDiscounts = {};
    let agentCartDiscount = 0;

    if (userId) {
      try {
        const firestore = admin.firestore();
        const userDoc = await firestore.collection("users").doc(userId).get();

        if (userDoc.exists) {
          const userData = userDoc.data();

          // Get user's product-specific discounts
          if (userData.productDiscounts && Array.isArray(userData.productDiscounts)) {
            userData.productDiscounts.forEach((d) => {
              if (d.productId && d.discount) {
                userProductDiscounts[d.productId] = Number(d.discount) || 0;
              }
            });
          }

          // Get agent's cart discount if user was referred
          if (userData.referredBy) {
            const agentDoc = await firestore.collection("users").doc(userData.referredBy).get();
            if (agentDoc.exists) {
              agentCartDiscount = agentDoc.data().cartDiscount || 0;
            }
          }
        }
      } catch (firestoreError) {
        console.warn("⚠️ Could not fetch user data from Firestore:", firestoreError.message);
        // Continue with validation but without user-specific discounts
      }
    }

    // Fetch material groups for shipping calculation
    const materialGroups = await MaterialGroupSettings.find().lean();
    const materialGroupMap = {};
    materialGroups.forEach((mg) => {
      materialGroupMap[mg.groupName] = {
        minPrice: mg.minPrice || 0,
        transportationPrice: mg.transportationPrice || 0,
      };
    });

    // Validate each product and calculate expected totals
    let expectedProductTotal = 0;
    const groupTotals = {
      "Colors and Accessories": 0,
      Powders: 0,
      "Gypsum and Tracks": 0,
    };
    let hasCraneUnload = false;

    for (const item of productItems) {
      const { CatalogNumber, Quantity, UnitPrice, Description } = item;

      if (!CatalogNumber || !Quantity || UnitPrice === undefined) {
        return { valid: false, message: "Invalid item data: missing required fields" };
      }

      // Reject negative prices for products
      if (UnitPrice < 0) {
        return { valid: false, message: `מחיר לא תקין למוצר: ${CatalogNumber}` };
      }

      // Parse SKU (may contain variation info)
      const baseSku = CatalogNumber.split(" - ")[0].trim();

      // Find product in database
      const product = await Product.findOne({
        $or: [
          { 'מק"ט': baseSku },
          { 'מק"ט': CatalogNumber },
          { מזהה: parseInt(baseSku) || -1 },
        ],
      }).lean();

      if (!product) {
        console.warn(`⚠️ Product not found for SKU: ${baseSku}`);
        // Allow unknown products but don't validate their price
        expectedProductTotal += UnitPrice * Quantity;
        continue;
      }

      // Parse selected attributes from description
      const selectedAttributes = parseAttributesFromDescription(Description);

      // Get user's discount for this specific product
      const userDiscount = userProductDiscounts[product._id?.toString()] || 0;

      // Calculate expected price
      const expectedPrice = calculateExpectedPrice(product, selectedAttributes, userDiscount);

      // Compare with submitted price (allow small tolerance for rounding)
      const priceDiff = Math.abs(UnitPrice - expectedPrice);
      if (priceDiff > PRICE_TOLERANCE) {
        console.error(
          `❌ Price mismatch for ${product.שם}: submitted ₪${UnitPrice}, expected ₪${expectedPrice}`
        );
        return {
          valid: false,
          message: `מחיר לא תקין למוצר: ${product.שם}`,
        };
      }

      // Add to totals
      expectedProductTotal += UnitPrice * Quantity;

      // Track material group totals for shipping
      if (product.materialGroup && groupTotals.hasOwnProperty(product.materialGroup)) {
        groupTotals[product.materialGroup] += UnitPrice * Quantity;
      }

      // Check for crane unload
      // Note: We can't directly verify craneUnload flag from cart, but we can verify the fee
      if (product.materialGroup === "Gypsum and Tracks") {
        // If crane unload fee was submitted, items exist that could require it
        if (submittedCraneUnload > 0) {
          hasCraneUnload = true;
        }
      }
    }

    // Validate shipping costs
    let expectedShipping = 0;
    Object.entries(groupTotals).forEach(([groupName, total]) => {
      const groupSettings = materialGroupMap[groupName];
      if (groupSettings && total > 0 && total < groupSettings.minPrice) {
        expectedShipping += groupSettings.transportationPrice;
      }
    });

    if (Math.abs(submittedShipping - expectedShipping) > PRICE_TOLERANCE) {
      console.error(
        `❌ Shipping mismatch: submitted ₪${submittedShipping}, expected ₪${expectedShipping}`
      );
      return { valid: false, message: "עלות משלוח לא תקינה" };
    }

    // Validate crane unload fee
    if (submittedCraneUnload > 0) {
      // If crane fee submitted, it must be exactly CRANE_UNLOAD_FEE
      if (Math.abs(submittedCraneUnload - CRANE_UNLOAD_FEE) > PRICE_TOLERANCE) {
        console.error(
          `❌ Crane fee mismatch: submitted ₪${submittedCraneUnload}, expected ₪${CRANE_UNLOAD_FEE}`
        );
        return { valid: false, message: "עלות פריקת מנוף לא תקינה" };
      }
      // Crane unload only valid for Gypsum and Tracks products
      if (groupTotals["Gypsum and Tracks"] === 0) {
        console.error("❌ Crane fee submitted but no Gypsum products in cart");
        return { valid: false, message: "פריקת מנוף לא רלוונטית להזמנה זו" };
      }
    }

    // Validate cart discount
    if (submittedCartDiscount !== 0) {
      // Cart discount should be negative
      if (submittedCartDiscount > 0) {
        return { valid: false, message: "הנחת עגלה לא תקינה" };
      }

      const expectedCartDiscount = -(expectedProductTotal * agentCartDiscount) / 100;
      if (Math.abs(submittedCartDiscount - expectedCartDiscount) > PRICE_TOLERANCE) {
        console.error(
          `❌ Cart discount mismatch: submitted ₪${submittedCartDiscount}, expected ₪${expectedCartDiscount} (${agentCartDiscount}%)`
        );
        return { valid: false, message: "הנחת עגלה לא תקינה" };
      }
    } else if (agentCartDiscount > 0) {
      // User should have cart discount but didn't submit it
      console.warn(
        `⚠️ User has ${agentCartDiscount}% cart discount but none submitted`
      );
    }

    // Validate VAT
    const preVATTotal =
      expectedProductTotal + submittedCartDiscount + submittedShipping + submittedCraneUnload;
    const expectedVAT = Math.round(preVATTotal * VAT_RATE * 100) / 100;

    if (Math.abs(submittedVAT - expectedVAT) > PRICE_TOLERANCE) {
      console.error(
        `❌ VAT mismatch: submitted ₪${submittedVAT}, expected ₪${expectedVAT}`
      );
      return { valid: false, message: 'מע"מ לא תקין' };
    }

    console.log("✅ Payment validation passed - all prices verified");
    return {
      valid: true,
      details: {
        productTotal: expectedProductTotal,
        shipping: expectedShipping,
        craneUnload: submittedCraneUnload,
        cartDiscount: submittedCartDiscount,
        vat: expectedVAT,
        total: preVATTotal + expectedVAT,
      },
    };
  } catch (error) {
    console.error("❌ Payment validation error:", error);
    return { valid: false, message: "שגיאה באימות מחירים" };
  }
};

const createPayment = async (req, res) => {
  try {
    const requestData = req.body;
    const userId = requestData.UserId || null;

    // SECURITY: Validate cart prices against database
    if (requestData.Items && Array.isArray(requestData.Items)) {
      const validation = await validateCartPrices(requestData.Items, userId);

      if (!validation.valid) {
        console.error("❌ Payment validation failed:", validation.message);
        return res.status(400).json({
          success: false,
          error: "אימות מחירים נכשל",
          message: validation.message,
        });
      }

      // Log validation details
      if (validation.details) {
        console.log("📊 Validated order:", validation.details);
      }
    }

    // Remove UserId before sending to payment gateway (not needed there)
    delete requestData.UserId;

    // SECURITY: Add payment token server-side only (not exposed to client)
    const groupPrivateToken = process.env.GROUP_PRIVATE_TOKEN;
    if (!groupPrivateToken) {
      console.error("❌ GROUP_PRIVATE_TOKEN not configured");
      return res.status(500).json({
        success: false,
        error: "שגיאת תצורה",
        message: "Payment configuration error",
      });
    }
    requestData.GroupPrivateToken = groupPrivateToken;

    // Don't log full request data in production (contains sensitive info)
    if (process.env.NODE_ENV !== "production") {
      console.log("📤 Sending payment request to iCredit");
    }

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

    let data;

    // Check if response is JSON or XML
    if (contentType && contentType.includes("application/json")) {
      data = JSON.parse(responseText);
    } else if (contentType && (contentType.includes("xml") || contentType.includes("text/html"))) {
      // Handle XML response (likely an error from iCredit)
      console.error("❌ Received XML/HTML response instead of JSON");
      return res.status(400).json({
        success: false,
        error: "תגובה לא תקינה משרת התשלום",
        message: "Payment provider returned an error. Please try again.",
      });
    } else {
      // Try to parse as JSON anyway
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse payment response");
        return res.status(500).json({
          success: false,
          error: "תגובה לא תקינה משרת התשלום",
          message: "Could not process payment response",
        });
      }
    }

    if (data.Status === 0 && data.URL) {
      res.json({
        success: true,
        paymentUrl: data.URL,
        salePrivateToken: data.PrivateSaleToken,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "שגיאה בקבלת URL לתשלום",
        message: "Could not initiate payment",
      });
    }
  } catch (error) {
    console.error("❌ Payment error:", error.message);
    res.status(500).json({
      success: false,
      error: "שגיאה בשרת",
      message: "An error occurred while processing payment",
    });
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
