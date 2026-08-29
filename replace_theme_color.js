const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /bg-\[#ff006b\]/gi, replacement: 'bg-primary' },
  { regex: /text-\[#ff006b\]/gi, replacement: 'text-primary' },
  { regex: /border-\[#ff006b\]/gi, replacement: 'border-primary' },
  { regex: /fill-\[#ff006b\]/gi, replacement: 'fill-primary' },
  { regex: /shadow-\[#ff006b\]/gi, replacement: 'shadow-primary' },
  { regex: /"#ff006b"/gi, replacement: '"var(--primary-hex)"' },
  { regex: /'#ff006b'/gi, replacement: "'var(--primary-hex)'" },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      for (const rule of replacements) {
        content = content.replace(rule.regex, rule.replacement);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log("Done replacing theme colors.");
