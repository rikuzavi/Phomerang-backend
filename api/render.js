import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
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

    await page.waitForSelector("#crop-container", { visible: true });

    const element = await page.$("#crop-container");
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
