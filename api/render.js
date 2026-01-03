import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import Cors from "cors";

const cors = Cors({ origin: "*" });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  try {
    if (req.method !== "POST")
      return res.status(405).json({ message: "Only POST allowed" });

    const { html } = req.body;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      defaultViewport: chromium.defaultViewport,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.waitForSelector("#imgdiv", { visible: true });

    const element = await page.$("#imgdiv");
    const box = await element.boundingBox();

    const buffer = await page.screenshot({
      type: "png",
      clip: {
        x: Math.round(box.x) + 2,
        y: Math.round(box.y) + 2,
        width: Math.round(box.width) + 2,
        height: Math.round(box.height) + 2,
      },
    });

    await browser.close();

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send("Render failed");
  }
}

