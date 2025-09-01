const Payment= require('../models/Payment');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const createPayment = async (req, res) => {
    try {
        const { orderId, paymentMethod, amount } = req.body;

        // Validate order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Validate cart
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ success: false, error: 'Cart not found' });
        }

        // Create payment
        const payment = await Payment.create({
            order: orderId,
            user: req.user.id,
            paymentMethod,
            amount,
            status: 'pending'
        });

        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user.id });
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }
        res.status(200).json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
}

const updatePaymentStatus = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }

        payment.status = req.body.status;
        await payment.save();

        res.status(200).json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


const deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }

        await payment.remove();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};  

module.exports = {
    createPayment,
    getPayments,
    getPaymentById,
    updatePaymentStatus,
    deletePayment
};