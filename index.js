const packageJson = require("./package.json");
const express = require("express");
const app = express();
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const apiClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
  },
});

app.get("/watch", async (req, res) => {
  const { v } = req.query || {};
  if (!v) {
    res.status(400);
    res.send("Invalid Request");
    return;
  }
  try {
    const result = await apiClient.get(`https://youtube.com/watch?v=${v}`);
    const { window } = new JSDOM(result.data);
    console.log(result.data);
    const { document } = window;
    const metaList = [
      ...Array.from(document.querySelectorAll("meta[property]")),
      document.querySelector('meta[name="description"]'),
      document.querySelector('meta[name="keywords"]'),
    ];
    res.header({
      "Content-Type": "text/html",
      "Max-Age": 1 * 60 * 60 * 24 * 30,
    });
    res.send(
      `<!DOCTYPE html>
<html lang="en">
  <head>
    ${metaList.map((meta) => meta.outerHTML).join("\n")}
    <title>${document.title.replace("- YouTube", "- YouTube Music")}</title>
  </head>
<body>
  <script>
    location.href = location.href.replace(location.origin, 'https://music.youtube.com')
  </script>
</body>
</html>
`.replace(/\n/g, "")
    );
  } catch (e) {
    res.status(500);
    res.send("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  res.json({
    version: packageJson.version,
  });
});

app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("listen server on http://0.0.0.0:3000");
});
