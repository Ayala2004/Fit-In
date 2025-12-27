const fs = require('fs').promises;
const path = require('path');
const { join, relative } = path;

// Configuration
const outputFile = 'project_files.txt';
const ignorePatterns = [
  'node_modules',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  '.env',
  'coverage',
  '.vscode',
  '.idea',
  '.DS_Store',
  'node_copy_files_to_txt.js', 
  'project_files.txt',
  'generateStructure.cjs',
  '*.log',
  '*.tmp'
];


// Function to check if a path should be ignored
function shouldIgnore(filePath) {
  // Use the imported 'join' function directly, not 'path.join'
  // NOTE: join('', pattern) is equivalent to just 'pattern', 
  // so you could also simplify this to filePath.includes(pattern)
  return ignorePatterns.some(pattern => 
    filePath.includes(join('', pattern)) || filePath === pattern
  );
}

// Function to recursively get all files
async function getAllFiles(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = join(dir, file.name);
    
    // We only need to check the relative path for ignoring
    const relativePath = relative(process.cwd(), fullPath);

    if (shouldIgnore(relativePath)) {
      continue;
    }
    
    if (file.isDirectory()) {
      await getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  
  return fileList;
}

// Function to copy file contents to output file
async function copyFilesToTxt() {
  try {
    // Clear or create the output file
    await fs.writeFile(outputFile, '');
    
    // Get all files
    const files = await getAllFiles(process.cwd());
    
    // Process each file
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const relativePath = relative(process.cwd(), file);
        
        // Append file path and content to output file
        const outputContent = `\n--- ${relativePath} ---\n\n${content}\n`;
        await fs.appendFile(outputFile, outputContent, 'utf8');
      } catch (err) {
        // Skip binary files or files that can't be read
        if (err.code === 'ENOENT' || err.message.includes('invalid byte sequence')) {
             console.warn(`Skipping unreadable file ${file}:`, err.message);
        } else {
             console.error(`Error reading file ${file}:`, err.message);
        }
      }
    }
    
    console.log(`Successfully copied project structure to ${outputFile}`);
  } catch (err) {
    console.error('An error occurred:', err.message);
  }
}

// Run the script
copyFilesToTxt();