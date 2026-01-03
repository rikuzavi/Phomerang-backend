import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import Cors from "cors";

// Initializing the cors middleware
const cors = Cors({
  origin: "*" // allow all origins, or put your GitHub Pages URL
});

// Helper to wait for middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result)
      else resolve(result)
    });
  });
}

export default async function handler(req, res) {
  // Run CORS
  await runMiddleware(req, res, cors);

  try {
    if (req.method !== "POST")
      return res.status(405).json({ message: "Only POST allowed" });

    const { html } = req.body;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.waitForSelector("#imgdiv", { visible: true });

    const element = await page.$("#imgdiv");
    const buffer = await element.screenshot({ type: "png" });

    await browser.close();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", "attachment; filename=edited.png");
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send("Render failed");
  }
}

