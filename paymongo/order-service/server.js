const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory order database
const orders = new Map();
let orderCounter = 0;

// Configuration
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// POST /api/orders - Create a new order
app.post('/api/orders', async (req, res) => {
  let order = null;
  try {
    const { items, customer } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({
        success: false,
        error: 'Order must contain at least one item'
      });
    }

    // Validate every item BEFORE any order is created
    for (const item of items) {
      const qty = item && item.quantity === undefined ? 1 : item && item.quantity;
      if (!item || typeof item.productId !== 'string' || !item.productId) {
        return res.status(400).json({ success: false, error: 'Each item needs a productId' });
      }
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ success: false, error: 'Quantity must be a whole number of at least 1' });
      }
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Fetch product details from Product Service
      const productResponse = await axios.get(
        `${PRODUCT_SERVICE_URL}/api/products/${item.productId}`
      );

      if (!productResponse.data.success) {
        return res.status(404).json({
          success: false,
          error: `Product ${item.productId} not found`
        });
      }

      const product = productResponse.data.product;
      const quantity = item.quantity === undefined ? 1 : item.quantity;
      const amount = product.price * quantity;

      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: quantity,
        unitPrice: product.price,
        amount: amount
      });

      totalAmount += amount;
    }

    // Create order
    const orderId = `ord_${Date.now()}_${++orderCounter}`;
    order = {
      id: orderId,
      items: orderItems,
      customer: customer || { email: 'customer@example.com' },
      totalAmount: totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paymentSessionId: null,
      checkoutUrl: null
    };

    orders.set(orderId, order);

    // Initiate payment
    const paymentResponse = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payment/checkout`,
      {
        orderId: order.id,
        items: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          amount: item.unitPrice // Send unit price in centavos
        })),
        customerEmail: order.customer.email,
        successUrl: `${FRONTEND_URL}/payment-success.html?orderId=${order.id}`,
        cancelUrl: `${FRONTEND_URL}/payment-cancel.html?orderId=${order.id}`
      }
    );

    if (paymentResponse.data.success) {
      order.paymentSessionId = paymentResponse.data.sessionId;
      order.checkoutUrl = paymentResponse.data.checkoutUrl;
      orders.set(orderId, order);
    }

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items,
        checkoutUrl: order.checkoutUrl
      }
    });

  } catch (error) {
    console.error('Order creation error:', error.message);

    // Unknown product: Product Service answered 404
    if (error.response && error.response.status === 404 && !order) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Payment failed after the order was saved: never leave it looking payable
    if (order) {
      order.status = 'failed';
      order.updatedAt = new Date().toISOString();
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.response?.data || error.message
    });
  }
});

// GET /api/orders/:id - Get order details
app.get('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  res.json({
    success: true,
    order: order
  });
});

// PUT /api/orders/:id/status - Update order status (for webhooks)
app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  const validStatuses = ['pending', 'paid', 'cancelled', 'failed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be one of: pending, paid, cancelled, failed'
    });
  }

  // paid and cancelled are final: a cancelled order can never become paid
  if (order.status !== status && (order.status === 'paid' || order.status === 'cancelled')) {
    return res.status(409).json({
      success: false,
      error: `Order is already ${order.status} and cannot become ${status}`,
      order: order
    });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();
  orders.set(req.params.id, order);

  res.json({
    success: true,
    order: order
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ Order Service running on port ${PORT}`);
  console.log(`🔄 Connected to Product Service: ${PRODUCT_SERVICE_URL}`);
  console.log(`💰 Connected to Payment Service: ${PAYMENT_SERVICE_URL}`);
});
