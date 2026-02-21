import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium } from "playwright-core";

export async function launchPdfBrowser() {
  const executablePath = await chromium.executablePath();

  return playwrightChromium.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
}
