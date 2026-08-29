const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

function replaceInFile(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.json') || filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Don't replace database name so they don't lose data
    // We will do a generic replace, but revert the connection string if needed.
    content = content.replace(/FoodAppi/g, "Nectar");
    content = content.replace(/foodappi/g, "nectar");
    content = content.replace(/FOODAPPI/g, "NECTAR");

    // Protect the mongodb URI so we don't break the DB
    content = content.replace(/mongodb:\/\/127.0.0.1:27017\/nectar/g, "mongodb://127.0.0.1:27017/foodappi");

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
}

walk('./src', replaceInFile);
// also do it for some root files if needed
replaceInFile('./package.json');
replaceInFile('./README.md');
