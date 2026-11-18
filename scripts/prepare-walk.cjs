// Rebuild the Cleveland Way data, or pass a new guide slug to prepare its map assets.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const slug = process.argv[2];
if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Use a lowercase guide slug such as moorland-loop.');
const gpxPath = `assets/gpx/${slug || 'whitby-to-rhb-clevelandway'}.gpx`;
const xml = fs.readFileSync(path.join(root, gpxPath), 'utf8');
// This importer targets the single-segment gpx.studio export format.
const decode = text => text.replace(/&(?:amp|lt|gt|quot|apos);/g, value => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"})[value]);
const value = (xml, tag) => decode(xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] || '');
if ((xml.match(/<trkseg>/g) || []).length !== 1) throw Error('Review segment handling before importing a different GPX.');
const points = [...xml.matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)">([\s\S]*?)<\/trkpt>/g)].map(m => [+m[1], +m[2], +value(m[3], 'ele')]);
if (points.length < 2 || points.some(p => p.some(n => !Number.isFinite(n)))) throw Error('Invalid track');
const rad = x => x * Math.PI / 180;
const metres = (a,b) => 6371000 * 2 * Math.asin(Math.sqrt(Math.sin(rad(b[0]-a[0])/2)**2 + Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(rad(b[1]-a[1])/2)**2));
const cumulative = [0];
points.slice(1).forEach((p,i) => cumulative.push(cumulative[i] + metres(points[i],p)));
const pois = [...xml.matchAll(/<wpt lat="([^"]+)" lon="([^"]+)">([\s\S]*?)<\/wpt>/g)].map(m => {
  const point = [+m[1],+m[2]];
  const nearest = points.reduce((best,p,i) => {const distance = metres(point,p); return distance < best.distance ? {index:i,distance} : best;}, {distance:Infinity});
  const url = m[3].match(/<link href="([^"]+)"/)?.[1] || '';
  return {lat:point[0],lon:point[1],name:value(m[3],'name'),description:value(m[3],'desc'),symbol:value(m[3],'sym'),url:/^https:\/\//.test(url)?decode(url):'',trackIndex:nearest.index,offsetMetres:Math.round(nearest.distance),distanceKm:cumulative[nearest.index]/1000};
});

if (slug) {
  const km = cumulative.at(-1) / 1000;
  const data = {points, pois, km};
  const output = `assets/walks/${slug}`;
  const routeFile = `${output}/route-data.js`;
  const overviewFile = `${output}/overview.svg`;
  const overview = routeOverview(points, pois);
  fs.mkdirSync(path.join(root, output), {recursive:true});
  fs.writeFileSync(path.join(root, routeFile), `/* Generated from ${gpxPath}. */\nwindow.WALK_ROUTE = ${JSON.stringify(data)};\n`);
  fs.writeFileSync(path.join(root, overviewFile), overview);
  console.log(JSON.stringify({routeFile, overviewFile, km, pois: pois.map(({name, trackIndex}) => ({name, trackIndex}))}, null, 2));
} else {
  prepareClevelandWay();
}

function routeOverview(points, pois) {
  const coordinates = [...points, ...pois.map(({lat, lon}) => [lat, lon])];
  const latitudes = coordinates.map(point => point[0]);
  const longitudes = coordinates.map(point => point[1]);
  const south = Math.min(...latitudes), north = Math.max(...latitudes);
  const west = Math.min(...longitudes), east = Math.max(...longitudes);
  const longitudeScale = Math.cos(rad((south + north) / 2));
  const scale = Math.min(570 / ((east - west) * longitudeScale), 360 / (north - south));
  if (!Number.isFinite(scale)) throw Error('The GPX overview needs distinct coordinates.');
  const project = (lat, lon) => [
    (325 + (lon - (west + east) / 2) * longitudeScale * scale).toFixed(1),
    (220 - (lat - (south + north) / 2) * scale).toFixed(1)
  ];
  const track = points.map(([lat, lon]) => project(lat, lon).join(',')).join(' ');
  const escape = text => text.replace(/[&<>"]/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[char]));
  const markers = pois.map(({lat, lon, name}, index) => {
    const [x, y] = project(lat, lon);
    const number = index + 1;
    return `  <a href="#poi-${number}" aria-label="${escape(name || `Place ${number}`)}"><circle cx="${x}" cy="${y}" r="13" fill="#163e3a" stroke="#fffdf7" stroke-width="2"/><text x="${x}" y="${y}" dy=".35em" text-anchor="middle" fill="white" font-size="11" font-family="sans-serif">${number}</text></a>`;
  });
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 440" role="group" aria-label="GPX route overview">',
    `  <polyline points="${track}" fill="none" stroke="#fffdf7" stroke-width="7"/>`,
    `  <polyline points="${track}" fill="none" stroke="#bd5f42" stroke-width="3.5"/>`,
    ...markers,
    '</svg>',
    ''
  ].join('\n');
}

function prepareClevelandWay() {
  const saltwick = pois.find(p=>p.name==='Saltwick Bay');
  if (!saltwick) throw Error('Review stage boundaries for the updated POIs.');
  // Trinity House's published lighthouse location, used only to select an existing
  // GPX point beside this visible landmark. The downloaded track stays untouched.
  // https://www.trinityhouse.co.uk/notice-to-mariners/17/2025-whitby-lighthouse
  const lighthouse = [54 + 28.667/60, -34.094/60];
  const lighthouseIndex = points.reduce((best,p,i) => metres(p,lighthouse) < metres(points[best],lighthouse) ? i : best, 0);
  const boundaries = [0,saltwick.trackIndex,lighthouseIndex,points.length-1];
  const stages = boundaries.slice(1).map((end,i) => {
    const km = (cumulative[end]-cumulative[boundaries[i]])/1000;
    return {start:boundaries[i],end,km,minutesMin:Math.ceil(km/4*60/5)*5,minutesMax:Math.ceil(km/3*60/5)*5};
  });
  const data = {points,pois,stages,km:cumulative.at(-1)/1000,timeBasis:'Estimated at 3–4 km/h, excluding stops and café detours.'};
  fs.writeFileSync(path.join(root,'assets/walking-route-data.js'), '/* Generated from assets/gpx/whitby-to-rhb-clevelandway.gpx. */\nwindow.WALK_ROUTE = '+JSON.stringify(data)+';\n');
  console.log(JSON.stringify({km:data.km,stages,pois:pois.map(({name,offsetMetres})=>({name,offsetMetres}))},null,2));
}
