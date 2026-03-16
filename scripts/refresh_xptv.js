#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

(async () => {
  try {
    // 1. Get the new remote JSON source
    const url = 'https://raw.githubusercontent.com/fangkuia/XPTV/main/all.json';
    const response = await fetch(url);
    let content = await response.text();

    // 2. Remove comment lines (Standard safety for these types of config files)
    content = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');

    // 3. Parse JSON and update timestamp
    let jsonData = JSON.parse(content);
    
    // Ensure the structure has a 'lastUpdated' field for your format
    jsonData.lastUpdated = new Date().toISOString();

    // 4. Handle local modifications (Using a specific modify file for this source)
    // You can point this to 'box/m_modify.json' if you want to reuse the same rules,
    // or create 'box/all_modify.json' for source-specific overrides.
    const modifyFilePath = 'box/all_modify.json'; 
    
    if (fs.existsSync(modifyFilePath)) {
      const modifyContent = fs.readFileSync(modifyFilePath, 'utf-8');
      const rawModifyData = JSON.parse(modifyContent);
      
      const modifyDataArray = Array.isArray(rawModifyData) 
        ? rawModifyData 
        : [rawModifyData];

      // Process each modification item
      if (Array.isArray(jsonData.sites)) {
        modifyDataArray.forEach(modifyItem => {
          const siteIndex = jsonData.sites.findIndex(site => site.key === modifyItem.key);
          if (siteIndex !== -1) {
            if (modifyItem.new_key) {
              // Logic to clone and create a new entry with a different key
              const newSite = JSON.parse(JSON.stringify(jsonData.sites[siteIndex]));
              newSite.key = modifyItem.new_key;
              newSite.name = modifyItem.name || modifyItem.new_key;
              if (modifyItem.api) {
                newSite.api = modifyItem.api;
              }
              delete newSite.new_key;
              jsonData.sites.push(newSite);
            } else {
              // Standard merge/update logic
              jsonData.sites[siteIndex] = { ...jsonData.sites[siteIndex], ...modifyItem };
            }
          }
        });
      }
    }

    // 5. Save updated JSON to the new path
    const cleanedJSON = JSON.stringify(jsonData, null, 2);
    const outputPath = 'box/all.json';
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, cleanedJSON);

    console.log(`Successfully synced and saved to ${outputPath}`);
  } catch (error) {
    console.error('Error processing all.json:', error);
    process.exit(1);
  }
})();
