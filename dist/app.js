"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const axios_1 = __importDefault(require("axios"));
const feed_1 = require("feed");
const jsdom_1 = require("jsdom");
const morgan = require("morgan");
const app = express();
app.use(morgan("combined"));
app.get("/:userID", async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const userID = req.params.userID;
    if (!userID || userID === "favicon.ico") {
        res.status(200);
        return res.send("OK");
    }
    const httpRes = await axios_1.default.get(`https://b.hatena.ne.jp/${userID}`);
    if (httpRes.status === 404) {
        res.status(400);
        return res.send(`User "${userID}" is not found`);
    }
    else if (httpRes.status !== 200) {
        res.status(503);
        return res.send(`Some error occured. code: ${httpRes.status}`);
    }
    const html = await httpRes.data;
    const dom = new jsdom_1.JSDOM(html);
    const document = dom.window.document;
    const feed = new feed_1.Feed({
        title: `${userID}のブックマーク`,
        id: `https://b.hatena.ne.jp/${userID}`,
        link: `https://b.hatena.ne.jp/${userID}`,
        copyright: "All rights reserved 2022, Mochi",
    });
    for (const article of document.querySelectorAll(".bookmark-item")) {
        const comment = (_b = (_a = article.querySelector(".js-comment")) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0 ? _b : "";
        if (comment === "")
            continue;
        const title = (_d = (_c = article.querySelector(".centerarticle-entry-title a")) === null || _c === void 0 ? void 0 : _c.textContent) !== null && _d !== void 0 ? _d : "";
        const url = (_f = (_e = article
            .querySelector(".centerarticle-entry-title a")) === null || _e === void 0 ? void 0 : _e.getAttribute("href")) !== null && _f !== void 0 ? _f : "";
        const commentUrl = "https://b.hatena.ne.jp" +
            ((_h = (_g = article.querySelector(".centerarticle-users a")) === null || _g === void 0 ? void 0 : _g.getAttribute("href")) !== null && _h !== void 0 ? _h : "");
        const date = (() => {
            var _a, _b;
            const yyyymmdd = (_b = (_a = article.querySelector(".centerarticle-reaction-timestamp")) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0 ? _b : "";
            const [yy, mm, dd] = yyyymmdd.split("/").map((str) => Number(str));
            return new Date(yy, mm - 1, dd);
        })();
        feed.addItem({
            title,
            id: url,
            link: commentUrl,
            description: comment,
            content: `${comment}\n<a href="${commentUrl}" target="_blank">${commentUrl}</a>`,
            date,
        });
    }
    res.type("application/xml");
    res.send(feed.atom1());
});
app.listen(process.env.PORT);
