#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

(async () => {
  try {
    // 取得遠端 JSON，請按需要替換 URL
    const url = 'https://raw.liucn.cc/box/m.json';
    const response = await fetch(url);
    let content = await response.text();

    // 移除每行以 '//' 開頭的註解行
    content = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');

    // 解析遠端取得嘅 JSON 並更新 lastUpdated 欄位
    let jsonData = JSON.parse(content);
    jsonData.lastUpdated = new Date().toISOString();

    // 嘗試讀取本地修改檔案 box/m_modify.json，修改檔內容動態指定要更新嘅欄位值，例：
    // {
    //    "key": "暴风采集",
    //    "categories": ["国产剧", "大陆综艺", ...],
    //    "api": "新的 api 地址",
    //    "其他欄位": "其他內容"
    const modifyFilePath = 'box/m_modify.json';
    if (fs.existsSync(modifyFilePath)) {
      const modifyContent = fs.readFileSync(modifyFilePath, 'utf-8');
      const modifyData = JSON.parse(modifyContent);
      
      // 如果修改檔有 key 欄位，且 jsonData.sites 為陣列，就依 modifyData 裡面所有欄位更新對應項目
      if (modifyData.key && Array.isArray(jsonData.sites)) {
        jsonData.sites = jsonData.sites.map(site => {
          if (site.key === modifyData.key) {
            // 注意：這裡使用展開運算子，加上 Object.keys() 方式動態更新，不僅限於 categories
            // 也可只更新特定欄位：如 { ...site, categories: modifyData.categories }
            return { ...site, ...modifyData };
          }
          return site;
        });
      }
    }

    // 將更新後嘅 JSON 轉成字串格式，設定適當縮排
    const cleanedJSON = JSON.stringify(jsonData, null, 2);

    // 確保 box 資料夾存在，再寫入更新後嘅 JSON 到 box/m.json
    const outputPath = 'box/m.json';
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, cleanedJSON);

    console.log('Cleaned JSON saved successfully!');
  } catch (error) {
    console.error('Error processing JSON:', error);
    process.exit(1);
  }
})();
