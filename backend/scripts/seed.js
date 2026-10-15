require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/product.model");

const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;
const items = [
  ["Noise Cancelling Headphones", "Wireless over-ear headphones with active noise cancellation.", 4999, "Electronics", "headphones", 25],
  ["Mechanical Keyboard", "RGB mechanical keyboard with blue switches.", 2999, "Electronics", "keyboard", 10],
  ["Smartphone 128GB", "6.5 inch AMOLED display, 50MP camera, 5000mAh battery.", 17999, "Electronics", "phone", 8],
  ["Bluetooth Speaker", "Portable waterproof speaker with 12 hours of playtime.", 1999, "Electronics", "speaker", 0],
  ["Cotton Kurta", "Breathable regular-fit cotton kurta for everyday wear.", 899, "Fashion", "kurta", 40],
  ["Denim Jacket", "Classic mid-wash denim jacket with button closure.", 2499, "Fashion", "jacket", 15],
  ["Running Shoes", "Lightweight mesh running shoes with cushioned sole.", 3299, "Fashion", "shoes", 3],
  ["Atomic Habits", "A practical guide to building good habits and breaking bad ones.", 499, "Books", "habits", 60],
  ["The Pragmatic Programmer", "Classic handbook on becoming a better software craftsperson.", 1299, "Books", "pragmatic", 12],
  ["Ceramic Coffee Mug Set", "Set of four 300ml handmade ceramic mugs.", 749, "Home", "mugs", 30],
  ["LED Desk Lamp", "Dimmable desk lamp with three colour temperatures and USB port.", 1199, "Home", "lamp", 18],
  ["Cotton Bedsheet Set", "Double bedsheet with two pillow covers, 180 thread count.", 1599, "Home", "bedsheet", 22],
].map(([name, description, price, category, seed, stock]) => ({ name, description, price, category, image: img(seed), stock }));

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Product.deleteMany({});
  await Product.insertMany(items);
  console.log(`Seeded ${items.length} products`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});