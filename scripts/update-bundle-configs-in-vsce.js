const fs = require('fs');
const path = require('path');

const packagesDir = './packages';

function updateEsbuildConfigs() {
  traverseDirectories(packagesDir, 'esbuild.config.js', replaceEsbuildConfig);
}

function traverseDirectories(directory, targetName, callback) {
  fs.readdir(directory, { withFileTypes: true }, (err, files) => {
    if (err) {
    console.error(`Error reading directory ${directory}: ${err}`);
    return;
    }

    files.forEach(file => {
    if (file.isDirectory()) {
        const targetPath = path.join(directory, file.name, targetName);
        if (fs.existsSync(targetPath)) {
        callback(file.name);
        }
    }
    });
  });
}


function replaceEsbuildConfig(folderName) {
  const srcFile = `./bundle-publish-scripts/bundle-configs/${folderName}/esbuild.config.js`
  const targetFile = `./packages/${folderName}/esbuild.config.js`
  // Replace the srcFile with targetFile
  fs.copyFile(srcFile, targetFile, (err) => {
    if (err) {
      console.error(`Error copying file: ${err}`);
    } else {
      console.log(`Successfully replaced ${targetFile} with ${srcFile}`);
    }
  });
}

updateEsbuildConfigs();