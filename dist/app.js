"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const feed_1 = require("feed");
const jsdom_1 = require("jsdom");
const morgan = require('morgan');
const app = express();
app.use(morgan('combined'));
app.get('/:userID', async (req, res) => {
    const userID = req.params.userID;
    const httpRes = await fetch(`https://b.hatena.ne.jp/${userID}`);
    if (httpRes.status === 404) {
        res.status(400);
        return res.send(`User "${userID}" is not found`);
    }
    else if (httpRes.status !== 200) {
        res.status(503);
        return res.send(`Some error occured. code: ${httpRes.status}`);
    }
    const html = await httpRes.text();
    const dom = new jsdom_1.JSDOM(html);
    const document = dom.window.document;
    const feed = new feed_1.Feed({
        title: `${userID}のブックマーク`,
        id: `https://b.hatena.ne.jp/${userID}`,
        link: `https://b.hatena.ne.jp/${userID}`,
        copyright: 'All rights reserved 2022, Mochi',
    });
    for (const article of document.querySelectorAll('.bookmark-item')) {
        const title = article.querySelector('.centerarticle-entry-title a')?.textContent ?? '';
        const url = article.querySelector('.centerarticle-entry-title a')?.getAttribute('href') ?? '';
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
            content: comment,
            date,
        });
    }
    res.type('application/xml');
    res.send(feed.atom1());
});
app.listen(3000);
