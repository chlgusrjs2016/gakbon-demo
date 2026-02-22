import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium } from "playwright-core";
import puppeteer from "puppeteer-core";
import fs from "node:fs";

chromium.setGraphicsMode = false;

export async function launchPdfBrowser() {
  const executablePath = await resolveExecutablePath();

  return playwrightChromium.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
}

function isServerlessRuntime() {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_REGION ||
      process.env.AWS_EXECUTION_ENV?.toLowerCase().includes("lambda")
  );
}

function findLocalBrowserExecutable() {
  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean) as string[];

  for (const path of candidates) {
    if (fs.existsSync(path)) return path;
  }
  return null;
}

async function resolveExecutablePath() {
  const fromEnv = process.env.CHROME_EXECUTABLE_PATH;
  if (fromEnv) return fromEnv;

  if (!isServerlessRuntime()) {
    const local = findLocalBrowserExecutable();
    if (local) return local;
    throw new Error(
      "Local Chromium executable not found. Set CHROME_EXECUTABLE_PATH to your Chrome/Chromium binary."
    );
  }

  return chromium.executablePath();
}

function getLaunchArgs() {
  if (!isServerlessRuntime()) {
    // 로컬 브라우저(맥/리눅스)에 서버리스 전용 플래그를 과도하게 주지 않도록 최소화.
    return ["--no-sandbox", "--disable-setuid-sandbox"];
  }
  return [...chromium.args];
}

export async function renderPdfWithChromium(html: string) {
  const rendererErrors: string[] = [];
  const executablePath = await resolveExecutablePath();
  const args = getLaunchArgs();

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
      await page.evaluate(async () => {
        const doc = document as Document & { fonts?: FontFaceSet };
        if (doc.fonts?.ready) await doc.fonts.ready;
      });
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
      await page.evaluate(async () => {
        const doc = document as Document & { fonts?: FontFaceSet };
        if (doc.fonts?.ready) await doc.fonts.ready;
      });
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
