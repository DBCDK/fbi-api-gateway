import fs from "fs";
import path from "path";

const EXTENSION_DIR = "extension";
const DIST_DIR = "unpacked";
const OUT_DIR = "out";

// 1. Kopiér static assets
fs.mkdirSync(`${DIST_DIR}/static`, { recursive: true });
fs.cpSync(`${OUT_DIR}/_next/static`, `${DIST_DIR}/static`, { recursive: true });
fs.cpSync(`${EXTENSION_DIR}/`, `${DIST_DIR}/`, { recursive: true });

// 2. Kopiér HTML og andre filer
fs.readdirSync(OUT_DIR).forEach((file) => {
  const srcPath = path.join(OUT_DIR, file);
  const destPath = path.join(DIST_DIR, file);

  if (file.endsWith(".html")) {
    let html = fs.readFileSync(srcPath, "utf-8");
    html = html.replace(/\/_next\/static\//g, "/static/");
    fs.writeFileSync(destPath, html);
  } else if (file !== "_next") {
    fs.cpSync(srcPath, destPath, { recursive: true });
  }
});

// 3. (Valgfrit) Slet _next mappen bagefter
fs.rmSync(`${DIST_DIR}/_next`, { recursive: true, force: true });

console.log("Export patched for Chrome Extension!");
