const fs = require('fs');
const path = require('path');

// נתיב המקור
const sourceDir = 'C:\\Users\\Ayala\\Desktop\\FitIn\\fit-in\\src';
// נתיב הקובץ שיווצר
const outputFile = 'C:\\Users\\Ayala\\Desktop\\FitIn\\fit-in\\folderStructure.txt';

/**
 * פונקציה רקורסיבית שמחזירה מבנה תיקיות כטקסט
 */
function getFolderStructure(dir, prefix = '') {
  let output = '';
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    output += `${prefix}${item.name}\n`;
    if (item.isDirectory()) {
      output += getFolderStructure(path.join(dir, item.name), prefix + '  ');
    }
  }
  return output;
}

// יוצרים את הקובץ
try {
  const structure = getFolderStructure(sourceDir);
  fs.writeFileSync(outputFile, structure, 'utf8');
  console.log('מבנה התיקיות נשמר בהצלחה ב:', outputFile);
} catch (err) {
  console.error('שגיאה ביצירת הקובץ:', err);
}
