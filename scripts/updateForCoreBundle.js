const fs = require('fs');
const path = require('path');

// Function to update package.json

const packagePath = './package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const packageName = packageJson.name;
const isSdrUsed = packageJson?.dependencies["@salesforce/source-deploy-retrieve"]
function updatePackageJson(packageJson) {
  try {
    // Update package name
    if (packageJson.name) {
      packageJson.name += '-bundle';
    }

    // Remove 'pre*' scripts
    if (packageJson.scripts) {
      delete packageJson.scripts.prepare;
      delete packageJson.scripts.prepack;
    }

    // Update @salesforce/core dependency
    if (packageJson?.dependencies["@salesforce/core"]) {
      packageJson.dependencies["@salesforce/core-bundle"] = packageJson.dependencies["@salesforce/core"]
      delete packageJson.dependencies["@salesforce/core"];
    }

    // Update @salesforce/source-deploy-retrieve dependency
    if (isSdrUsed) {
      packageJson.dependencies["@salesforce/source-deploy-retrieve-bundle"] = packageJson.dependencies["@salesforce/source-deploy-retrieve"]
      delete packageJson.dependencies["@salesforce/source-deploy-retrieve"];
    }

    fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error(`Error writing to package.json: ${writeErr}`);
      } else {
        console.log('package.json updated successfully.');
      }
    });
  } catch (parseErr) {
    console.error(`Error parsing JSON in package.json: ${parseErr}`);
  }
}

function updateImports() {
  const dirs = ['./src', './test'];
  function replaceTextInFile(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    let result = data.replace(
      /'@salesforce\/core'/g,
      "'@salesforce/core-bundle'"
    );
    result = result.replace(
      /'@salesforce\/core\/(.+)'/g,
      "'@salesforce/core-bundle'"
    );
    if (isSdrUsed) {
      result = result.replace(
        /'@salesforce\/source-deploy-retrieve/g,
        "'@salesforce/source-deploy-retrieve-bundle"
      );
    }
    fs.writeFileSync(filePath, result, 'utf8');
  }
  function traverseDirectory(directory) {
    fs.readdirSync(directory).forEach((file) => {
      const fullPath = path.join(directory, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        traverseDirectory(fullPath);
      } else if (path.extname(fullPath) === '.ts') {
        replaceTextInFile(fullPath);
      }
    });
  }
  dirs.forEach((dir) => {
    traverseDirectory(dir);
  });
  console.log('imports updated successfully');
}

function updateLoadMessages() {
  const dirs = ['./src', './test'];
  console.log('packageName: ', packageName);
  const updateUsagesWithinFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(`Messages\\.loadMessages\\('${packageName}'`, 'g');
    let modifiedContent = content.replace(regex, `Messages.loadMessages('${packageName}-bundle'`);
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
  };
  function traverseDirectory(directory) {
    fs.readdirSync(directory).forEach((file) => {
      const fullPath = path.join(directory, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        traverseDirectory(fullPath);
      } else if (path.extname(fullPath) === '.ts') {
        updateUsagesWithinFile(fullPath);
      }
    });
  }
  dirs.forEach((dir) => {
    traverseDirectory(dir);
  });
  console.log('imports updated successfully');
}

updatePackageJson(packageJson);
updateImports();
updateLoadMessages();