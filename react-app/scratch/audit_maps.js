const fs = require('fs');

function auditMap(path) {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  console.log(`\nAudit for ${path}:`);
  for (const id in data.events) {
    const event = data.events[id];
    console.log(`ID ${id}: "${event.name}" at (${event.x}, ${event.y})`);
  }
}

auditMap('/Users/sangar/Downloads/habitmon_rpg/react-app/public/Data/Map002.json');
auditMap('/Users/sangar/Downloads/habitmon_rpg/react-app/public/Data/Map070.json');
auditMap('/Users/sangar/Downloads/habitmon_rpg/react-app/public/Data/Map010.json');
auditMap('/Users/sangar/Downloads/habitmon_rpg/react-app/public/Data/Map011.json');
