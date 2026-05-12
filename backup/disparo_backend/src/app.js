const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req,res)=>res.send('API OK'));

app.use('/auth', authRoutes);
app.use('/campaigns', campaignRoutes);

module.exports = app;