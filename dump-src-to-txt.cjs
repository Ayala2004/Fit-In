const fs = require("fs");
const path = require("path");

const SRC_DIR = "C:\\Users\\Ayala\\Desktop\\FitIn\\fit-in\\src";
const OUTPUT_FILE = "C:\\Users\\Ayala\\Desktop\\FitIn\\fit-in\\fit-in-content.txt";
const PRISMA_SCHEMA = "C:\\Users\\Ayala\\Desktop\\FitIn\\fit-in\\prisma\\schema.prisma";

function readAllFiles(dir, result = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      readAllFiles(fullPath, result);
    } else {
      result.push(fullPath);
    }
  }

  return result;
}

function dumpFilesToTxt() {
  let output = "";

  // 👈 קודם נוסיף את schema.prisma
  if (fs.existsSync(PRISMA_SCHEMA)) {
    const prismaContent = fs.readFileSync(PRISMA_SCHEMA, "utf8");
    output += `==============================\n`;
    output += `FILE: prisma/schema.prisma\n`;
    output += `==============================\n`;
    output += prismaContent + "\n\n";
  } else {
    console.warn("⚠ prisma/schema.prisma not found, skipping.");
  }

  const files = readAllFiles(SRC_DIR);

  for (const filePath of files) {
    const relativePath = path.relative(SRC_DIR, filePath);
    const content = fs.readFileSync(filePath, "utf8");

    output += `==============================\n`;
    output += `FILE: src/${relativePath}\n`;
    output += `==============================\n`;
    output += content + "\n";
  }

  fs.writeFileSync(OUTPUT_FILE, output, "utf8");
  console.log("✔ Finished writing:", OUTPUT_FILE);
}

dumpFilesToTxt();
