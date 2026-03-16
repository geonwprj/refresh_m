#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

(async () => {
  try {
    const url = 'https://raw.githubusercontent.com/fangkuia/XPTV/main/all.json';
    const response = await fetch(url);
    let content = await response.text();

    content = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');

    let rawData = JSON.parse(content);
    
    let jsonData = {
      "spider": "./fty.jar;md5;3d161697458ecbcd2651a749db761ba1",
      "wallpaper": "https://深色壁纸.xxooo.cf/",
      "warningText": "资源来自网络，所有内容仅供学习使用，请勿用于违法及商业用途，请勿付费购买。",
      "sites": []
    };

    if (Array.isArray(rawData.sites)) {
      jsonData.sites = rawData.sites.map(site => {
        // 1. Generate/Clean Key (Supports Chinese, Alphanumeric, underscores)
        let generatedKey = site.key || "";
        if (!generatedKey) {
          if (site.api.startsWith('http')) {
            try {
              generatedKey = new URL(site.api).hostname;
            } catch (e) {
              generatedKey = site.name;
            }
          } else {
            generatedKey = site.api;
          }
        }
        // Clean key: allow Chinese, English, Numbers. Remove dots, slashes, special emoji/symbols.
        generatedKey = generatedKey.replace(/[^\u4e00-\u9fa5a-zA-Z0-9_]/g, '');

        // 2. Build aligned object
        const alignedSite = {
          "key": generatedKey,
          "name": site.name,
          "type": site.type || 1,
          "api": site.api,
          // Use source value if exists, otherwise default to 1
          "searchable": site.hasOwnProperty('searchable') ? site.searchable : 1,
          "quickSearch": site.hasOwnProperty('quickSearch') ? site.quickSearch : 1,
          "filterable": site.hasOwnProperty('filterable') ? site.filterable : 1
        };

        // 3. Add optional fields if they exist in the source
        if (site.ext) alignedSite.ext = site.ext;
        if (site.jar) alignedSite.jar = site.jar;
        if (site.changeable !== undefined) alignedSite.changeable = site.changeable;

        return alignedSite;
      });
    }

    // 4. Handle local modifications
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

    const outputPath = 'box/all.json';
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

    console.log(`Success! Aligned ${jsonData.sites.length} sites including specialized items.`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
