import fs from "fs";
import archiver from "archiver";

const EXTENSION_DIR = "extension";
const DIST_DIR = "unpacked";
const OUT_DIR = "out";
const ZIP_FILE = "unpacked.zip";

// 1. Opret outputmappe
fs.mkdirSync(`${DIST_DIR}/next/_next/static`, { recursive: true });

fs.cpSync(`${OUT_DIR}/`, `${DIST_DIR}/`, {
  recursive: true,
});

// 2. Kopiér alle statiske assets
fs.cpSync(`${OUT_DIR}/_next/static`, `${DIST_DIR}/next/_next/static`, {
  recursive: true,
});

// 5. Kopiér extension-filer
fs.cpSync(`${EXTENSION_DIR}/`, `${DIST_DIR}/`, { recursive: true });

// 6. Ryd op hvis _next stadig ligger der
fs.rmSync(`${DIST_DIR}/_next`, { recursive: true, force: true });

// 7. Pak som zip
function zipDirectory(sourceDir, outPath) {
  const output = fs.createWriteStream(outPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      console.log(`✅ Zip oprettet: ${outPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", (err) => reject(err));
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// 8. Kør det hele
(async () => {
  await zipDirectory(DIST_DIR, ZIP_FILE);
  console.log("🎉 Extension klar! Alle referencer til _next fjernet.");
})();
