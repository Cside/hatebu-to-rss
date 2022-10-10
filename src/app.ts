import express = require('express');
import axios from 'axios';
import { Feed } from 'feed';
import { JSDOM } from 'jsdom';

const morgan = require('morgan');

const app = express();
app.use(morgan('combined'));


app.get('/:userID', async (req: express.Request, res: express.Response) => {
    const userID = req.params.userID;
    if (!userID || userID === 'favicon.ico') {
        res.status(200);
        return res.send('OK');
    }

    const httpRes = await axios.get<string>(`https://b.hatena.ne.jp/${userID}`);
    if (httpRes.status === 404) {
        res.status(400);
        return res.send(`User "${userID}" is not found`);
    } else if (httpRes.status !== 200) {
        res.status(503);
        return res.send(`Some error occured. code: ${httpRes.status}`);
    }
    const html = await httpRes.data;

    const dom = new JSDOM(html);
    const document = dom.window.document

    const feed = new Feed({
        title: `${userID}のブックマーク`,
        id: `https://b.hatena.ne.jp/${userID}`,
        link: `https://b.hatena.ne.jp/${userID}`,
        copyright: 'All rights reserved 2022, Mochi',
    });

    for (const article of document.querySelectorAll('.bookmark-item')) {
        const title = article.querySelector('.centerarticle-entry-title a')?.textContent ?? '';
        const url = article.querySelector('.centerarticle-entry-title a')?.getAttribute('href') ?? '';
        const commentUrl = article.querySelector('.centerarticle-users a')?.getAttribute('href') ?? '';
        const comment = article.querySelector('.js-comment')?.textContent ?? '';
        const date = (() => {
            const yyyymmdd = article.querySelector('.centerarticle-reaction-timestamp')?.textContent ?? '';
            const [yy, mm, dd] = yyyymmdd.split('/').map(str => Number(str));
            return new Date(yy, mm - 1, dd);
        })();
        feed.addItem({
            title,
            id: url,
            link: url,
            description: comment,
            content: `${comment}\nhttps://b.hatena.ne.jp${commentUrl}`,
            date,
        })
    }
    res.type('application/xml');
    res.send(feed.atom1());
});

app.listen(process.env.PORT);