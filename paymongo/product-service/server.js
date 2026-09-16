const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory product database
const products = [
  {
    id: 'p1',
    name: 'SIAI T-Shirt',
    price: 35000, // PHP 350.00 in centavos
    description: 'Comfortable cotton t-shirt with SIAI logo',
    stock: 50
  },
  {
    id: 'p2',
    name: 'SIAI Hoodie',
    price: 75000, // PHP 750.00 in centavos
    description: 'Premium hoodie with embroidered logo',
    stock: 30
  },
  {
    id: 'p3',
    name: 'SIAI Cap',
    price: 20000, // PHP 200.00 in centavos
    description: 'Classic cap with SIAI embroidery',
    stock: 40
  },
  {
    id: 'p4',
    name: 'SIAI Notebook',
    price: 15000, // PHP 150.00 in centavos
    description: 'Hardbound notebook with SIAI branding',
    stock: 100
  },
  {
    id: 'p5',
    name: 'Canteen Meal Voucher',
    price: 5000, // PHP 50.00 in centavos
    description: 'Pre-order meal voucher for school canteen',
    stock: 200
  }
];

// GET /api/products - List all products
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    products: products
  });
});

// GET /api/products/:id - Get single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }
  res.json({
    success: true,
    product: product
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Product Service running on port ${PORT}`);
  console.log(`📦 Available products: ${products.length}`);
});