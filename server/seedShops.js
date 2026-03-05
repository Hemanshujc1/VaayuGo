const path = require("path");
const fs = require("fs");
const axios = require("axios");
const sharp = require("sharp");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");
const { sequelize, User, Shop, Product, ShopCategory, Category } = require("./models");

const shopsToSeed = [
  { name: "FreshMart Grocery", category: "grocery" },
  { name: "DailyNeeds Grocery", category: "grocery" },
  { name: "HealthyBasket Grocery", category: "grocery" },
  { name: "CarePlus Medical", category: "medical" },
  { name: "MediTrust Pharmacy", category: "medical" },
  { name: "LifeCare Medical", category: "medical" },
  { name: "WriteWell Stationary", category: "stationary" },
  { name: "EduKart Stationary", category: "stationary" },
  { name: "PaperPoint Stationary", category: "stationary" },
  { name: "OfficeEssentials Stationary", category: "stationary" },
];

async function generateImage(seed, savePath) {
  const url = `https://picsum.photos/seed/${seed}/800/800`;
  try {
    const response = await axios({ url, responseType: "arraybuffer" });
    await sharp(response.data)
      .resize(600, 600)
      .jpeg({ quality: 80 })
      .toFile(savePath);
    return true;
  } catch (error) {
    console.error(`Failed to download image for seed: ${seed}`, error.message);
    return false;
  }
}

async function runSeeder() {
  try {
    console.log("Starting Seeder...");
    fs.mkdirSync(path.join(__dirname, "uploads", "shopimages"), { recursive: true });
    fs.mkdirSync(path.join(__dirname, "uploads", "productimages"), { recursive: true });

    // Ensure Categories exist
    for (const shop of shopsToSeed) {
      await Category.findOrCreate({ where: { name: shop.category } });
    }

    const hashedPassword = await bcrypt.hash("shopkeeper@123", 10);

    for (let i = 0; i < shopsToSeed.length; i++) {
        const shopData = shopsToSeed[i];
        
        // 1. Create or Find a User for the Shopkeeper
        const [user] = await User.findOrCreate({
            where: { email: `shop${i+1}@vaayugo.com` },
            defaults: {
                name: `${shopData.name} Owner`,
                mobile_number: faker.string.numeric(10),
                address: faker.location.streetAddress(),
                location: 'Central',
                password: hashedPassword,
                role: 'shopkeeper',
                is_blocked: false
            }
        });

        // 2. Create or Find the Shop
        const [shop] = await Shop.findOrCreate({
            where: { owner_id: user.id },
            defaults: {
                name: shopData.name,
                category: shopData.category,
                location_address: faker.location.streetAddress(),
                status: 'approved',
                is_open: true,
                rating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
                delivery_rating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 })
            }
        });

        // Link Category
        const category = await Category.findOne({ where: { name: shopData.category } });
        if (category) {
            await ShopCategory.create({ shop_id: shop.id, category_id: category.id });
        }

        console.log(`✅ Created Shop: ${shop.name} (Owner: ${user.email})`);

        // 3. Create Products for this Shop
        const productCount = faker.number.int({ min: 10, max: 20 });
        for (let j = 0; j < productCount; j++) {
            const productName = faker.commerce.productName();
            
            const product = await Product.create({
                shop_id: shop.id,
                name: productName,
                description: faker.commerce.productDescription(),
                price: faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }),
                stock_quantity: faker.number.int({ min: 10, max: 200 }),
                is_available: true,
                images: []
            });

            // Generate Image
            const imgFileName = `product-${product.id}-${Date.now()}.jpg`;
            const imgPath = path.join(__dirname, "uploads", "productimages", imgFileName);
            const relativePath = `/uploads/productimages/${imgFileName}`;

            const success = await generateImage(`${product.id}-${shop.id}-${j}`, imgPath);
            
            if (success) {
                product.image_url = relativePath;
                product.images = [relativePath];
                await product.save();
            }

            console.log(`  📦 Added Product: ${product.name} - ₹${product.price}`);
        }
    }

    console.log("🎉 All shops and products seeded successfully!");
  } catch (error) {
    console.error("Seeding Error:", error);
  } finally {
    process.exit(0);
  }
}

runSeeder();