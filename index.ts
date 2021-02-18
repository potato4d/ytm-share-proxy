import express from 'express'
import axios from "axios"
import jsdom from "jsdom"
import packageJson from './package.json'

const app = express();
const { JSDOM } = jsdom

const apiClient = axios.create({
  headers: {
    "User-Agent": `${process.env.YTM_USER_AGENT}`
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
    const { document } = window;
    const metaList = [
      ...Array.from(document.querySelectorAll("meta[property]")),
      document.querySelector('meta[name="description"]'),
      document.querySelector('meta[name="keywords"]'),
    ];
    res.header({
      "Content-Type": "text/html",
      "Cache-Control": `s-maxage: ${1 * 60 * 60 * 24 * 30}`,
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
    console.error(e);
    res.status(500);
    res.send("Internal Server Error");
  }
});

if (process.env.NODE_ENV != 'production') {
  app.use(express.static('./public'))
}

app.listen(~~`${process.env.PORT || 3000}`, "0.0.0.0", () => {
  console.log("listen server on http://0.0.0.0:3000");
});
