#!/usr/bin/env node
/**
 * Usage: node scripts/screenshot.mjs [url] [output]
 * Defaults: url=http://localhost:3000  output=/tmp/screenshot.png
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3000';
const output = process.argv[3] || '/tmp/screenshot.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
await page.screenshot({ path: output, fullPage: true });
console.log(`Screenshot saved: ${output}`);
await browser.close();
