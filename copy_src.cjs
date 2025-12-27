const fs = require('fs');
const path = require('path');

// נתיב המקור
const sourceDir = 'C:\\Users\\Ayala\\Desktop\\FitIn\\fit-in\\src';
// נתיב הקובץ שיווצר
const outputFile = 'C:\\Users\\Ayala\\Desktop\\FitIn\\fit-in\\allContent.txt';

/**
 * פונקציה רקורסיבית שמעתיקה את תוכן כל הקבצים
 */
function copyFilesContent(dir, prefix = '') {
  let output = '';
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      output += `\n${prefix}[DIR] ${item.name}\n`;
      output += copyFilesContent(fullPath, prefix + '  ');
    } else if (item.isFile()) {
      output += `\n${prefix}[FILE] ${item.name}\n`;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        output += content + '\n';
      } catch (err) {
        output += `[ERROR reading file]\n`;
      }
    }
  }
  return output;
}

// יוצרים את הקובץ
try {
  const allContent = copyFilesContent(sourceDir);
  fs.writeFileSync(outputFile, allContent, 'utf8');
  console.log('כל תוכן הקבצים נשמר בהצלחה ב:', outputFile);
} catch (err) {
  console.error('שגיאה ביצירת הקובץ:', err);
}
