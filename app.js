const express = require('express');
const helmet = require('helmet');
const app = express();

const { getUnis, getMenuByCanteenId } = require('./index');

app.use(helmet());

const PORT = 4000;

app.get('/', (req, res) => {
    res.send('<h1>Mensa Api</h1><p>For documentation you\'l have to ask me ¯\\_(ツ)_/¯</p>');
});

app.get('/unis/', async (req, res) => {
    const unis = await getUnis();
    res.json(unis);
});

app.get('/canteens/:id?/:dateString?', async (req, res) => {
    const menu = await getMenuByCanteenId(req.params.id, req.params.dateString);
    res.json(menu);
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});
