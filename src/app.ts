import express = require("express");
import axios from "axios";
import { Feed } from "feed";
import { JSDOM } from "jsdom";

const morgan = require("morgan");

const app = express();
app.use(morgan("combined"));

app.get("/:userID", async (req: express.Request, res: express.Response) => {
  const userID = req.params.userID;
  if (!userID || userID === "favicon.ico") {
    res.status(200);
    return res.send("OK");
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
  const document = dom.window.document;

  const feed = new Feed({
    title: `${userID}のブックマーク`,
    id: `https://b.hatena.ne.jp/${userID}`,
    link: `https://b.hatena.ne.jp/${userID}`,
    copyright: "All rights reserved 2022, Mochi",
  });

  for (const article of document.querySelectorAll(".bookmark-item")) {
    const comment = article.querySelector(".js-comment")?.textContent ?? "";
    if (comment === "") continue;

    const title =
      article.querySelector(".centerarticle-entry-title a")?.textContent ?? "";
    const url =
      article
        .querySelector(".centerarticle-entry-title a")
        ?.getAttribute("href") ?? "";
    const commentUrl =
      "https://b.hatena.ne.jp" +
      (article.querySelector(".centerarticle-users a")?.getAttribute("href") ??
        "");
    const date = (() => {
      const yyyymmdd =
        article.querySelector(".centerarticle-reaction-timestamp")
          ?.textContent ?? "";
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
