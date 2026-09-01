const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const targets = ['public', 'dist', 'out'];
const filesToCopy = ['index.html', 'nutrinance-demo.html', 'styles.css', 'script.js', 'README.md'];

for (const target of targets) {
  const targetDir = path.resolve(__dirname, target);
  fs.mkdirSync(targetDir, { recursive: true });
  
  for (const f of filesToCopy) {
    const srcFile = path.resolve(__dirname, f);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(targetDir, f));
    }
  }

  const assetsDir = path.resolve(__dirname, 'assets');
  if (fs.existsSync(assetsDir)) {
    copyDirSync(assetsDir, path.join(targetDir, 'assets'));
  }
}

console.log('Static build completed successfully for all target outputs (., public, dist, out).');
