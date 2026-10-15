const crypto = require("crypto");
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const getRazorpay = require("../config/razorpay");

const PHONE_RE = /^[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;

const ADDRESS_FIELDS = [
  ["fullName", "Full name"],
  ["phone", "Phone"],
  ["addressLine1", "Address"],
  ["city", "City"],
  ["state", "State"],
  ["pincode", "Pincode"],
];

// Trims input and returns { address, error }. Never trusts the shape of the body.
const cleanAddress = (raw) => {
  const src = raw && typeof raw === "object" ? raw : {};
  const address = {};

  for (const [key, label] of ADDRESS_FIELDS) {
    const value = typeof src[key] === "string" ? src[key].trim() : "";
    if (!value) return { error: `${label} is required.` };
    address[key] = value;
  }

  address.phone = address.phone.replace(/[\s-]/g, "");
  if (!PHONE_RE.test(address.phone)) {
    return { error: "Phone must be a valid 10-digit mobile number." };
  }
  if (!PINCODE_RE.test(address.pincode)) {
    return { error: "Pincode must contain 6 digits." };
  }
  return { address };
};

// POST /orders/create-payment-order
const createPaymentOrder = async (req, res) => {
  try {
    // 1. Validate shipping address (only thing we accept from the client)
    const { address, error } = cleanAddress(req.body?.shippingAddress);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    // 2. Load the server-side cart with LIVE product data
    const customer = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "name price image stock",
    });

    if (!customer || customer.cart.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty." });
    }

    // 3. Verify products exist and have enough stock; build the snapshot
    const issues = [];
    const items = [];

    for (const row of customer.cart) {
      const product = row.product;

      if (!product) {
        issues.push("A product in your cart is no longer available.");
        continue;
      }
      if (product.stock < 1) {
        issues.push(`${product.name} is out of stock.`);
        continue;
      }
      if (row.quantity > product.stock) {
        issues.push(
          `Insufficient stock for ${product.name}. Only ${product.stock} left.`
        );
        continue;
      }

      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: row.quantity,
        image: product.image,
      });
    }

    if (issues.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: issues.join(" "), issues });
    }

    // 4. Server owns the total
    const totalAmount =
      Math.round(
        items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100
      ) / 100;
    const amountInPaise = Math.round(totalAmount * 100);

    // 5. Build the order (not saved yet) so its _id can be the Razorpay receipt
    const order = new Order({
      customer: customer._id,
      items,
      shippingAddress: address,
      totalAmount,
    });

    // 6. Create the Razorpay order; on failure nothing is persisted, cart untouched
    let razorpayOrder;
    try {
      razorpayOrder = await getRazorpay().orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: order._id.toString(),
      });
    } catch (err) {
      console.error("Razorpay order creation failed:", err);
      return res.status(502).json({
        success: false,
        message: "Unable to start payment. Please try again.",
      });
    }

    // 7. Persist the pending order with the Razorpay order id
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // paise
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID, // Key ID is public, the secret is never sent
    });
  } catch (err) {
    console.error("createPaymentOrder error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Restore stock for items already decremented
const rollbackStock = async (items) => {
  await Promise.all(
    items.map((i) =>
      Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })
    )
  );
};

// POST /orders/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!mongoose.isValidObjectId(shopKartOrderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order id" });
    }
    if (
      ![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(
        (v) => typeof v === "string" && v.length > 0
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment details" });
    }

    // Ownership is part of the query: someone else's order is simply "not found"
    const order = await Order.findOne({
      _id: shopKartOrderId,
      customer: req.user._id,
    });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Already processed (retry / double click)
    if (order.paymentStatus === "PAID") {
      if (order.status === "PENDING_PAYMENT") {
        return res.status(409).json({
          success: false,
          message:
            "Payment was received but the order could not be fulfilled. Please contact support.",
        });
      }
      return res.json({
        success: true,
        message: "Order already confirmed",
        order,
      });
    }

    // Verify HMAC SHA256 using the order id stored in OUR database
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(razorpay_signature);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!valid) {
      // Order stays PENDING, cart untouched
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    // Atomically claim the order so concurrent verifies can't both proceed
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: "PENDING" },
      { $set: { paymentStatus: "PAID", razorpayPaymentId: razorpay_payment_id } },
      { new: true }
    );
    if (!claimed) {
      return res.status(409).json({
        success: false,
        message: "This order is already being processed.",
      });
    }

    // Final stock decrement: atomic per item, rolled back if any item fails
    const done = [];
    for (const item of claimed.items) {
      const result = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.modifiedCount === 0) {
        await rollbackStock(done);
        // Money was taken but stock ran out: stays PAID + PENDING_PAYMENT for manual refund
        return res.status(409).json({
          success: false,
          message: `${item.name} just went out of stock. Your payment will need to be refunded. Please contact support.`,
        });
      }
      done.push(item);
    }

    claimed.status = "PLACED";
    await claimed.save();

    // Only now clear the cart
    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

    return res.json({
      success: true,
      message: "Payment verified. Order placed.",
      order: claimed,
    });
  } catch (err) {
    console.error("verifyPayment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /orders  (paid orders only, newest first)
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
      paymentStatus: "PAID",
    }).sort({ createdAt: -1 });

    return res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error("getOrders error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /orders/:id
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order id" });
    }

    const order = await Order.findOne({ _id: id, customer: req.user._id });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, order });
  } catch (err) {
    console.error("getOrderById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createPaymentOrder, verifyPayment, getOrders, getOrderById };