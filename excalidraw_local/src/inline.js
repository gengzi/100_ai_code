const fs = require('fs');
const path = require('path');

const files = {
    react: '../react.production.min.js',
    reactDom: '../react-dom.production.min.js',
    excalidraw: '../excalidraw.production.min.js'
};

Object.entries(files).forEach(([name, filePath]) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const base64 = Buffer.from(content).toString('base64');
    const dataUrl = `data:text/javascript;base64,${base64}`;
    fs.writeFileSync(`${name}-inline.html`, `<script src="${dataUrl}"></script>`);
    console.log(`${name} 内联完成: ${dataUrl.substring(0, 50)}...`);
});