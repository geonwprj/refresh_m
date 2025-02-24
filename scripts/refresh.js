#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// 如果使用 Node.js 18+ 可直接使用內建 fetch，否則請安裝 node-fetch
const fetch = require('node-fetch');

(async () => {
  try {
    // 替換成你的 JSON URL
    const url = 'https://raw.liucn.cc/box/m.json';
    const response = await fetch(url);
    let content = await response.text();

    // 移除每行以 '//' 開頭嘅註解行
    content = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');

    // 解析 JSON 並做修改處理，例如加入 lastUpdated 欄位
    let jsonData = JSON.parse(content);
    jsonData.lastUpdated = new Date().toISOString();

    // 轉回字串，設定適當縮排
    const cleanedJSON = JSON.stringify(jsonData, null, 2);

    // 將清理後的 JSON 寫入 box/m.json，確保目標資料夾存在
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
