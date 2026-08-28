const fs = require('fs');
const path = 'C:/Users/bhave/OneDrive/Desktop/splinzo/pubspec.yaml';
let content = fs.readFileSync(path, 'utf8');

const regex = /version: 1\.0\.2\+5/;
const replacement = 'version: 1.0.3+6';

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content);
    console.log('SUCCESS: pubspec.yaml version bumped to 1.0.3+6');
} else {
    console.log('ERROR: Target version string not found in pubspec.yaml!');
}
