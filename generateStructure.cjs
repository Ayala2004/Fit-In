// generateStructure.cjs
const fs = require("fs");
const path = require("path");

// נתיב מלא לתיקייה שבה נשמר הקובץ
const outputFile = "C:\\Users\\Ayala\\Desktop\\FitIn\\fit-in\\structure.txt";
const rootDir = "C:\\Users\\Ayala\\Desktop\\FitIn\\fit-in"; // התיקייה שאת רוצה לסרוק

function scanDir(dir, indent) {
  indent = indent || "";
  let result = "";
  const items = fs.readdirSync(dir, { withFileTypes: true });

  items.forEach(item => {
    result += `${indent}${item.name}\n`;
    if (item.isDirectory()) {
      result += scanDir(path.join(dir, item.name), indent + "  ");
    }
  });

  return result;
}

const structure = scanDir(rootDir);

fs.writeFileSync(outputFile, structure);
console.log(`מבנה הספרייה נכתב ל-${outputFile}`);
