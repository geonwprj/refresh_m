#!/usr/bin/env node

const fs = require('fs');
const fetch = require('node-fetch');

(async () => {
try {
// Replace with your JSON URL
const url = 'https://raw.liucn.cc/box/m.json';
const response = await fetch(url);
let content = await response.text();
  // Remove lines that start with '//' (using RegEx multiline flag)
// This assumes each comment is on its own line.
content = content.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');

// Try to parse the cleaned content, modify it as needed, then stringify it.
let jsonData = JSON.parse(content);

// Example modification: set a property 'lastUpdated' to current timestamp.
jsonData.lastUpdated = new Date().toISOString();

// Stringify with indentation if needed.
const cleanedJSON = JSON.stringify(jsonData, null, 2);

// Write the cleaned JSON to a file in your repository
// For example, into the 'docs' folder that is served by GitHub Pages.
fs.writeFileSync('docs/cleaned.json', cleanedJSON);

console.log('Cleaned JSON saved successfully!');
} catch (error) {
console.error('Error processing JSON:', error);
process.exit(1);
}
})();
