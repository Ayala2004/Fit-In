const fs = require('fs');
const path = require('path');

// הגדרות - אילו תיקיות וקבצים להתעלם מהם
const OUTPUT_FILE = 'project_content.txt';
const IGNORE_LIST = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.env',
  '.DS_Store',
  'favicon.ico',
  OUTPUT_FILE,
  'generate_structure.cjs' // השם של הקובץ הזה
];

const writeStream = fs.createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });

function getProjectFiles(dir, indent = "") {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    // דילוג על קבצים/תיקיות ברשימת ההתעלמות
    if (IGNORE_LIST.includes(file)) return;

    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // כתיבת שם התיקייה
      writeStream.write(`${indent}[DIR] ${file}\n\n`);
      // כניסה רקורסיבית לתוך התיקייה
      getProjectFiles(filePath, indent + "  ");
    } else {
      // בדיקה אם הקובץ הוא טקסטואלי (פשוט לפי סיומת) כדי לא להעתיק תמונות/בינארי
      const isTextFile = /\.(ts|tsx|js|jsx|json|css|prisma|txt|md|cjs|mjs)$/i.test(file);
      
      if (isTextFile) {
        // כתיבת שם הקובץ
        writeStream.write(`${indent}[FILE] ${file}\n`);
        
        // קריאת תוכן הקובץ וכתיבתו
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          writeStream.write(content + "\n\n");
        } catch (err) {
          writeStream.write(`Error reading file: ${err.message}\n\n`);
        }
      } else {
        // אם זה קובץ בינארי (כמו favicon), רק נכתוב את השם
        writeStream.write(`${indent}[FILE] ${file} (Binary content skipped)\n\n`);
      }
    }
  });
}

console.log("🚀 מתחיל לאסוף נתונים מהפרויקט...");
try {
  // התחלה מהתיקייה הנוכחית (שורש הפרויקט)
  getProjectFiles(process.cwd());
  console.log(`✅ הסתיים בהצלחה! התוכן נשמר בקובץ: ${OUTPUT_FILE}`);
} catch (error) {
  console.error("❌ שגיאה במהלך ההרצה:", error);
} finally {
  writeStream.end();
}