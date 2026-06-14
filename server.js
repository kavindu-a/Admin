const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection (your provided URI)
const MONGODB_URI = 'mongodb+srv://Movie_Bot:tZGqdSzN6JaOt5ez@moviebot.bfksyk1.mongodb.net/botadmin?retryWrites=true&w=majority';

// Define Bot Schema
const botSchema = new mongoose.Schema({
    botNumber: { type: String, required: true, unique: true, trim: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Bot = mongoose.model('Bot', botSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ---------- API Routes ----------

// Get all bots
app.get('/api/bots', async (req, res) => {
    try {
        const bots = await Bot.find().sort({ createdAt: -1 });
        res.json(bots);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get stats: total bots & active count
app.get('/api/stats', async (req, res) => {
    try {
        const total = await Bot.countDocuments();
        const activeCount = await Bot.countDocuments({ active: true });
        res.json({ total, activeCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new bot
app.post('/api/bots', async (req, res) => {
    try {
        const { botNumber } = req.body;
        if (!botNumber || botNumber.trim() === '') {
            return res.status(400).json({ message: 'Bot number is required' });
        }
        const existing = await Bot.findOne({ botNumber: botNumber.trim() });
        if (existing) {
            return res.status(409).json({ message: 'Bot number already exists' });
        }
        const newBot = new Bot({ botNumber: botNumber.trim(), active: true });
        await newBot.save();
        res.status(201).json(newBot);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Toggle active status
app.patch('/api/bots/:id/active', async (req, res) => {
    try {
        const { active } = req.body;
        const bot = await Bot.findByIdAndUpdate(
            req.params.id,
            { active: active === true },
            { new: true }
        );
        if (!bot) return res.status(404).json({ message: 'Bot not found' });
        res.json(bot);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete bot
app.delete('/api/bots/:id', async (req, res) => {
    try {
        const bot = await Bot.findByIdAndDelete(req.params.id);
        if (!bot) return res.status(404).json({ message: 'Bot not found' });
        res.json({ message: 'Bot deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Serve frontend for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Admin panel running at http://localhost:${PORT}`);
});
