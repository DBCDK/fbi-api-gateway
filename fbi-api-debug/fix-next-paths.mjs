import fs from "fs";
import path from "path";
import archiver from "archiver";

const EXTENSION_DIR = "extension";
const DIST_DIR = "unpacked";
const OUT_DIR = "out";
const ZIP_FILE = "unpacked.zip";

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

// 4. Pak `unpacked/` som zip
function zipDirectory(sourceDir, outPath) {
  const output = fs.createWriteStream(outPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      console.log(
        `Created zip archive: ${outPath} (${archive.pointer()} total bytes)`
      );
      resolve();
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false); // false = no root folder inside zip
    archive.finalize();
  });
}

(async () => {
  await zipDirectory(DIST_DIR, ZIP_FILE);
  console.log("Export patched and zipped for Chrome Extension!");
})();
