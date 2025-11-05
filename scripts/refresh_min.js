#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (e) {
    return false;
  }
}

(async () => {
  try {
    // Get remote JSON
    const url = 'https://raw.liucn.cc/box/m.json';
    const response = await fetch(url);
    let content = await response.text();

    // Remove comment lines
    content = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');

    // Parse JSON and update timestamp
    let jsonData = JSON.parse(content);
    jsonData.lastUpdated = new Date().toISOString();

    // Filter sites
    if (Array.isArray(jsonData.sites)) {
      const accessibleSites = [];
      for (const site of jsonData.sites) {
        if (site.type === 1 && site.api && isValidUrl(site.api)) {
          try {
            const apiResponse = await fetch(site.api, { method: 'HEAD', timeout: 5000 });
            if (apiResponse.ok) {
              site.api = site.api.replace('https://', 'https://dark-night-ea5e.fpzw5pvb5j.workers.dev/');
              accessibleSites.push(site);
            }
          } catch (error) {
            // API not accessible or other fetch error, skip this site
          }
        }
      }
      jsonData.sites = accessibleSites;
    }

    // Save updated JSON
    const cleanedJSON = JSON.stringify(jsonData, null, 2);
    const outputPath = 'box/m_min.json';
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, cleanedJSON);

    console.log('Filtered JSON updated successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();