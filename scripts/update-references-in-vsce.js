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
        if (json.dependencies && json.dependencies[oldDep]) {
          json.dependencies[newDep] = json.dependencies[oldDep].startsWith('^') ? json.dependencies[oldDep] : '^' + json.dependencies[oldDep];
          delete json.dependencies[oldDep];
          updated = true;
        }
        // Update packaging dependencies
        const packagingDeps = json?.packaging?.packageUpdates?.dependencies;
        if (packagingDeps && packagingDeps[oldDep]) {
          packagingDeps[newDep] = packagingDeps[oldDep].startsWith('^') ? packagingDeps[oldDep] : '^' + packagingDeps[oldDep];
          delete packagingDeps[oldDep];
          updated = true;
        }
        // Update bundling script
        if (json.scripts && json.scripts["bundle:extension"]) {
          let bundlingScript = json.scripts["bundle:extension"];
          const newDep = referencesMap[oldDep];
          if (bundlingScript.includes(oldDep)) {
            bundlingScript = bundlingScript.replace(new RegExp(`--external:${oldDep}`, 'g'), `--external:${newDep}`);
            updated = true;
          }
          json.scripts["bundle:extension"] = bundlingScript;
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

  // Function to update package.json directly under the packages directory
  function traverseDirectories(directory) {
    fs.readdir(directory, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error(`Error reading directory ${directory}: ${err}`);
        return;
      }

      files.forEach(file => {
        if (file.isDirectory()) {
          const packageJsonPath = path.join(directory, file.name, 'package.json');
          if (fs.existsSync(packageJsonPath)) {
            updateDependencies(packageJsonPath);
          }
        }
      });
    });
  }

  // Start traversing from the packages directory
  traverseDirectories(packagesDir);
}

function updateImports() {
  const dirs = ['src', 'test'];
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

    fs.writeFileSync(filePath, result, 'utf8');
  }
  // Function to update package.json directly under the packages directory
  function traverseDirectories(directory) {
    fs.readdir(directory, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error(`Error reading directory ${directory}: ${err}`);
        return;
      }

      files.forEach(file => {
        if (file.isDirectory()) {
          const packageJsonPath = path.join(directory, file.name, 'esbuild.config.js');
          if (fs.existsSync(packageJsonPath)) {
            replaceTextInFile(packageJsonPath);
          }
        }
      });
    });
  }

  // Start traversing from the packages directory
  traverseDirectories(packagesDir);
}

updatePackageJson();
updateImports();
updateEsbuildConfig();