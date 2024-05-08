const fs = require('fs');
const path = require('path');

const packagesDir = './packages';

// References Map
const referencesMap = {
  "@salesforce/core": "@salesforce/core-bundle",
  "@salesforce/apex-node": "@salesforce/apex-node-bundle",
  "@salesforce/templates": "@salesforce/templates-bundle",
  "@salesforce/source-tracking": "@salesforce/source-tracking-bundle",
  "@salesforce/source-deploy-retrieve": "@salesforce/source-deploy-retrieve-bundle"
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
          callback(targetPath);
        }
      }
    });
  });
}

function updateReferenceNames(data) {
  let result = data.replace(
    /'@salesforce\/core'/g,
    "'@salesforce/core-bundle'"
  );
  result = result.replace(
    /'@salesforce\/core\/(.+)'/g,
    "'@salesforce/core-bundle'"
  );
  result = result.replace(
    /'@salesforce\/source-deploy-retrieve/g,
    "'@salesforce/source-deploy-retrieve-bundle"
  );
  result = result.replace(
    /'@salesforce\/source-tracking/g,
    "'@salesforce/source-tracking-bundle"
  );
  result = result.replace(
    /'@salesforce\/templates/g,
    "'@salesforce/templates-bundle"
  );
  result = result.replace(
    /'@salesforce\/apex-node/g,
    "'@salesforce/apex-node-bundle"
  );
  return result;
}
// Update the references in package.json
function updatePackageJson() {
  // Function to update dependencies in package.json
  function updateDependencies(filePath) {
    // Read package.json file
    fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
      if (err) {
        console.error(`Error reading file ${filePath}: ${err}`);
        return;
      }

      let updated = false;
      const json = JSON.parse(data);

      // Check and update the dependencies according to sourceMap
      for (const oldDep in referencesMap) {
        const newDep = referencesMap[oldDep];
        // Update dependencies 
        if (json?.dependencies?.[oldDep]) {
          json.dependencies[newDep] = json.dependencies[oldDep].startsWith('^') ? json.dependencies[oldDep] : '^' + json.dependencies[oldDep];
          delete json.dependencies[oldDep];
          updated = true;
        }
        // Update packaging dependencies
        const packagingDeps = json?.packaging?.packageUpdates?.dependencies;
        if (packagingDeps?.[oldDep]) {
          packagingDeps[newDep] = packagingDeps[oldDep].startsWith('^') ? packagingDeps[oldDep] : '^' + packagingDeps[oldDep];
          delete packagingDeps[oldDep];
          updated = true;
        }
      }

      // If updated, write the modified package.json back to disk
      if (updated) {
        fs.writeFile(filePath, JSON.stringify(json, null, 2), (err) => {
          if (err) {
            console.error(`Error writing file ${filePath}: ${err}`);
          } else {
            console.log(`Updated dependencies in ${filePath}`);
          }
        });
      }
    });
  }

  // Start traversing from the packages directory
  traverseDirectories(packagesDir, 'package.json', updateDependencies);
}

function updateImports() {
  const dirs = ['src', 'test'];
  function replaceTextInFile(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    const result = updateReferenceNames(data);
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

  function traversePackages(directory) {
    fs.readdir(directory, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error(`Error reading directory ${directory}: ${err}`);
        return;
      }

      files.forEach(file => {
        if (file.isDirectory()) {
          dirs.forEach((dir) => {
            const tsDirPath = path.join(directory, file.name, dir);
            if (fs.existsSync(tsDirPath)) {
              traverseDirectory(tsDirPath)
            }
          });
        }
      });
    });
  }
  traversePackages(packagesDir);
  console.log('imports updated successfully');
}

// Update the references in esbuild.config.js
function updateEsbuildConfig() {
  function replaceTextInFile(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    const result = updateReferenceNames(data);
    fs.writeFileSync(filePath, result, 'utf8');
  }

  // Start traversing from the packages directory
  traverseDirectories(packagesDir, 'esbuild.config.js', replaceTextInFile);
}

updatePackageJson();
updateImports();
updateEsbuildConfig();