// Rebuild the browser data from the supplied GPX: node scripts/prepare-walk.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const xml = fs.readFileSync(path.join(root, 'assets/gpx/whitby-to-rhb-clevelandway.gpx'), 'utf8');
// This importer targets the supplied gpx.studio export, not arbitrary XML.
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
