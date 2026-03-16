#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

(async () => {
  try {
    const url = 'https://raw.githubusercontent.com/fangkuia/XPTV/main/all.json';
    const response = await fetch(url);
    let content = await response.text();

    // Remove comment lines
    content = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');

    let rawData = JSON.parse(content);
    
    // Define your standard template headers
    let jsonData = {
      "spider": "./fty.jar;md5;3d161697458ecbcd2651a749db761ba1",
      "wallpaper": "https://深色壁纸.xxooo.cf/",
      "warningText": "资源来自网络，所有内容仅供学习使用，请勿用于违法及商业用途，请勿付费购买。",
      "sites": []
    };

    if (Array.isArray(rawData.sites)) {
      jsonData.sites = rawData.sites.map(site => {
        // 1. Generate a clean key to avoid duplicates and special chars
        // Uses the hostname from the API URL (e.g., '360zy.com' -> '360zycom')
        let generatedKey = '';
        try {
          const urlObj = new URL(site.api);
          generatedKey = urlObj.hostname.replace(/[^a-zA-Z0-2026]/g, '');
        } catch (e) {
          // Fallback if API is not a valid URL
          generatedKey = site.name.replace(/[^a-zA-Z0-2026]/g, '');
        }

        // 2. Return aligned object with your defaults
        return {
          "key": site.key || generatedKey,
          "name": site.name,
          "type": site.type || 1,
          "api": site.api,
          "searchable": 1,
          "quickSearch": 1,
          "filterable": 1
        };
      });
    }

    // 3. Handle local modifications (same logic as your original script)
    const modifyFilePath = 'box/all_modify.json';
    if (fs.existsSync(modifyFilePath)) {
      const modifyContent = fs.readFileSync(modifyFilePath, 'utf-8');
      const modifyDataArray = Array.isArray(JSON.parse(modifyContent)) 
        ? JSON.parse(modifyContent) 
        : [JSON.parse(modifyContent)];

      modifyDataArray.forEach(modifyItem => {
        const siteIndex = jsonData.sites.findIndex(site => site.key === modifyItem.key);
        if (siteIndex !== -1) {
          if (modifyItem.new_key) {
            const newSite = { ...jsonData.sites[siteIndex], ...modifyItem };
            newSite.key = modifyItem.new_key;
            delete newSite.new_key;
            jsonData.sites.push(newSite);
          } else {
            jsonData.sites[siteIndex] = { ...jsonData.sites[siteIndex], ...modifyItem };
          }
        }
      });
    }

    // 4. Save the formatted JSON
    const outputPath = 'box/all.json';
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

    console.log(`Success! Aligned ${jsonData.sites.length} sites to ${outputPath}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
