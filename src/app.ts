import express = require('express');
const morgan = require('morgan');

const app = express();
app.use(morgan('combined'));

app.get('/', (req: express.Request, res: express.Response) => {
    req.query.id = req.query.user
    res.status(204).send();
});

app.listen(3000);