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
  const executablePath = await chromium.executablePath();
  const args = [...chromium.args];

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
    console.error("[pdf] playwright renderer failed, fallback to puppeteer", playwrightError);
  }

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
}
