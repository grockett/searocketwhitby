const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root,'assets/walking-map.js'),'utf8');

function setup({failMap=false,failDialog=false}={}) {
  const dataContext = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets/walking-route-data.js'),'utf8'),dataContext);
  const assets = [], timers = new Map(), classes = new Set();
  const element = tag => ({tag,hidden:true,innerHTML:'<svg>route overview</svg>',textContent:'',attributes:{},
    addEventListener(type,fn){this[type+'Event']=fn;},
    append(...children){children.forEach(child=>{child.parent=this;});},
    replaceChildren(){this.innerHTML='';}, remove(){this.removed=true;},
    setAttribute(key,value){this.attributes[key]=value;},focus(){this.focused=true;}
  });
  const ids = ['walk-map-shell','walk-map','map-explore','map-fit','map-fullscreen','map-dialog','map-slot','map-status'];
  const nodes = Object.fromEntries(ids.map(id=>[id,element('div')]));
  const dialog=nodes['map-dialog'];dialog.open=false;
  dialog.showModal=()=>{if(failDialog)throw Error('Dialog unavailable');dialog.open=true;};
  dialog.close=()=>{dialog.open=false;dialog.closeEvent();};
  let markers=0,fitCalls=0,removedMaps=0,tileError;
  const map={fitBounds(){fitCalls++;},invalidateSize(){},remove(){removedMaps++;}};
  const bounds={extend(){return this;}};
  const library={map:()=>map,
    tileLayer:()=>({on(type,fn){tileError=fn;return this;},addTo(){if(failMap)throw Error('Initialization failed');}}),
    polyline:()=>({addTo(){return this;},getBounds:()=>bounds}),
    divIcon:()=>({}),marker:()=>{markers++;return{bindPopup(){return this;},addTo(){}};},
    circleMarker:()=>({bindTooltip(){return this;},addTo(){}})
  };
  const window={WALK_ROUTE:dataContext.window.WALK_ROUTE,scrollY:250,scrollTo(options){this.restored=options.top;}};
  const document={getElementById:id=>nodes[id],createElement:element,head:{append(...items){assets.push(...items);}},
    documentElement:{classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}}};
  const context={window,document,setTimeout(fn){const id=timers.size+1;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)};
  Object.defineProperty(context,'L',{get:()=>window.L});
  vm.runInNewContext(source,context);
  const active=tag=>assets.filter(a=>a.tag===tag&&!a.removed).at(-1);
  const loadScript=()=>{window.L=library;active('script').onload();};
  return {nodes,assets,window,classes,timers,active,loadScript,
    click:()=>nodes['map-explore'].clickEvent(),
    counts:()=>({markers,fitCalls,removedMaps}),tileError:()=>tileError()};
}

test('stylesheet failure retries CSS even after Leaflet JS has loaded',async()=>{
  const app=setup();let attempt=app.click();app.loadScript();app.active('link').onerror();await attempt;
  assert.equal(app.nodes['walk-map'].innerHTML,'<svg>route overview</svg>');
  assert.equal(app.nodes['map-explore'].disabled,false);
  const scriptCount=app.assets.filter(a=>a.tag==='script').length;
  attempt=app.click();assert(app.active('link'));app.active('link').onload();await attempt;
  assert.equal(app.assets.filter(a=>a.tag==='script').length,scriptCount);
  assert.equal(app.assets.filter(a=>a.tag==='link').length,2);
  assert.equal(app.counts().markers,6);
  assert.equal(app.nodes['map-explore'].hidden,true);
});

test('JS failure and timeout preserve the overview and allow another attempt',async()=>{
  for(const failure of ['script','timeout']){
    const app=setup();const attempt=app.click();
    if(failure==='script')app.active('script').onerror();else [...app.timers.values()][0]();
    await attempt;
    assert.equal(app.nodes['walk-map'].innerHTML,'<svg>route overview</svg>');
    assert.equal(app.nodes['map-explore'].disabled,false);
    const retry=app.click();app.active('link').onload();app.loadScript();await retry;
    assert.equal(app.counts().markers,6);
  }
});

test('initialization failure removes the partial map and restores the SVG',async()=>{
  const app=setup({failMap:true});const attempt=app.click();app.active('link').onload();app.loadScript();await attempt;
  assert.equal(app.counts().removedMaps,1);
  assert.equal(app.nodes['walk-map'].innerHTML,'<svg>route overview</svg>');
  assert.equal(app.nodes['map-fit'].hidden,true);
  assert.equal(app.nodes['map-fullscreen'].hidden,true);
});

test('fullscreen and native dismissal preserve the map and restore page position',async()=>{
  const app=setup();const attempt=app.click();app.loadScript();app.active('link').onload();await attempt;
  app.nodes['map-fit'].clickEvent();assert.equal(app.counts().fitCalls,2);
  app.nodes['map-fullscreen'].clickEvent();assert.equal(app.nodes['map-dialog'].open,true);
  app.nodes['map-dialog'].close();
  assert.equal(app.nodes['walk-map-shell'].parent,app.nodes['map-slot']);
  assert.equal(app.classes.size,0);assert.equal(app.window.restored,250);
  app.tileError();assert.match(app.nodes['map-status'].textContent,/Background map unavailable/);
});

test('failed modal opening returns the map to its original slot',async()=>{
  const app=setup({failDialog:true});const attempt=app.click();app.loadScript();app.active('link').onload();await attempt;
  app.nodes['map-fullscreen'].clickEvent();
  assert.equal(app.nodes['walk-map-shell'].parent,app.nodes['map-slot']);
  assert.equal(app.classes.size,0);
});
