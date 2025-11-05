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
          const siteIndex = jsonData.sites.findIndex(site => site.key === modifyItem.key);
          if (siteIndex !== -1) {
            if (modifyItem.new_key) {
              const newSite = JSON.parse(JSON.stringify(jsonData.sites[siteIndex]));
              newSite.key = modifyItem.new_key;
              newSite.name = modifyItem.name || modifyItem.new_key;
              if (modifyItem.api) {
                newSite.api = modifyItem.api;
              }
              delete newSite.new_key;
              jsonData.sites.push(newSite);
            } else {
              jsonData.sites[siteIndex] = { ...jsonData.sites[siteIndex], ...modifyItem };
            }
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
