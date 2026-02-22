import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium } from "playwright-core";
import puppeteer from "puppeteer-core";

export async function launchPdfBrowser() {
  const executablePath = await chromium.executablePath();

  return playwrightChromium.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
}

export async function renderPdfWithChromium(html: string) {
  const rendererErrors: string[] = [];
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath());
  const args = [...chromium.args];

  if (!executablePath) {
    throw new Error("Chromium executable path is empty");
  }

  try {
    const browser = await playwrightChromium.launch({
      args,
      executablePath,
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      const pdfBuffer = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (playwrightError) {
    const message =
      playwrightError instanceof Error ? playwrightError.message : String(playwrightError);
    rendererErrors.push(`playwright: ${message}`);
    console.error("[pdf] playwright renderer failed, fallback to puppeteer", playwrightError);
  }

  try {
    const browser = await puppeteer.launch({
      args,
      executablePath,
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (puppeteerError) {
    const message =
      puppeteerError instanceof Error ? puppeteerError.message : String(puppeteerError);
    rendererErrors.push(`puppeteer: ${message}`);
    throw new Error(`All PDF renderers failed: ${rendererErrors.join(" | ")}`);
  }
}
