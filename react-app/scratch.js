const fs = require('fs');

const generateHTML = (tilesetImage, name) => {
  return `
    <div style="display:inline-block; margin:20px; text-align:center;">
      <h2>${name}</h2>
      <div style="position:relative; display:inline-block;">
        <img src="${tilesetImage}" style="width: 512px; height: auto; image-rendering: pixelated;" />
        <div style="position:absolute; top:0; left:0; display:grid; grid-template-columns: repeat(8, 64px); grid-auto-rows: 64px;">
          ${Array.from({length: 128}, (_, i) => `<div style="border:1px solid red; color:yellow; font-weight:bold; text-shadow: 1px 1px 0 black, -1px -1px 0 black; display:flex; justify-content:flex-end; align-items:flex-end; padding:2px; box-sizing:border-box;">${i}</div>`).join('')}
        </div>
      </div>
    </div>
  `;
};

const html = `
<html>
<head><title>Tilesets</title></head>
<body style="background:#222; font-family:sans-serif;">
  ${generateHTML('Graphics/tilesets/gsc house 1.png', 'gsc house 1.png')}
  ${generateHTML('Graphics/tilesets/gsc house 2.png', 'gsc house 2.png')}
</body>
</html>
`;

fs.writeFileSync('public/labeled_tilesets.html', html);
console.log('Created labeled_tilesets.html');
