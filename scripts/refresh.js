#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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

    // Handle local modifications
    const modifyFilePath = 'box/m_modify.json';
    if (fs.existsSync(modifyFilePath)) {
      const modifyContent = fs.readFileSync(modifyFilePath, 'utf-8');
      const rawModifyData = JSON.parse(modifyContent);
      
      // Convert to array if single object
      const modifyDataArray = Array.isArray(rawModifyData) 
        ? rawModifyData 
        : [rawModifyData];

      // Process each modification item
      if (Array.isArray(jsonData.sites)) {
        modifyDataArray.forEach(modifyItem => {
          if (modifyItem.key) {
            jsonData.sites = jsonData.sites.map(site => {
              // Merge changes when key matches
              return site.key === modifyItem.key 
                ? { ...site, ...modifyItem } 
                : site;
            });
          }
        });
      }
    }

    // Save updated JSON
    const cleanedJSON = JSON.stringify(jsonData, null, 2);
    const outputPath = 'box/m.json';
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, cleanedJSON);

    console.log('JSON updated successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
