(() => {
  const data = window.WALK_ROUTE;
  const shell = document.getElementById('walk-map-shell');
  const canvas = document.getElementById('walk-map');
  const explore = document.getElementById('map-explore');
  const fit = document.getElementById('map-fit');
  const fullscreen = document.getElementById('map-fullscreen');
  const dialog = document.getElementById('map-dialog');
  const slot = document.getElementById('map-slot');
  const status = document.getElementById('map-status');
  if (!data || !shell) return;
  const overview = canvas.innerHTML;
  let map, bounds, pageScroll = 0, tileErrorShown = false, leafletLoad;
  const loadLeaflet = () => {
    if (leafletLoad) return leafletLoad;
    leafletLoad = new Promise((resolve,reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
    const script = window.L ? null : document.createElement('script');
    if (script) script.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
    let scriptReady = !!window.L, cssReady = false, settled = false;
    const ready = () => { if (!settled && scriptReady && cssReady) { settled = true; clearTimeout(timeout); resolve(); } };
    const failed = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (script) { script.onload = script.onerror = null; script.remove(); }
      css.onload = css.onerror = null;
      css.remove();
      leafletLoad = null;
      reject(Error('Map library unavailable'));
    };
    const timeout = setTimeout(failed,15000);
    if (script) {
      script.onload = () => { scriptReady = true; ready(); };
      script.onerror = failed;
    }
    css.onload = () => { cssReady = true; ready(); };
    css.onerror = failed;
    document.head.append(css);
    if (script) document.head.append(script);
    });
    return leafletLoad;
  };
  explore.hidden = false;
  explore.addEventListener('click', async () => {
    explore.disabled = true;
    status.textContent = 'Loading interactive map…';
    try {
      await loadLeaflet();
      tileErrorShown = false;
      canvas.replaceChildren();
      map = L.map(canvas,{scrollWheelZoom:false});
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom:19,
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).on('tileerror', () => {
        if (!tileErrorShown) status.textContent = 'Background map unavailable. The supplied track and points remain visible; you can also download the GPX.';
        tileErrorShown = true;
      }).addTo(map);
      const track = data.points.map(p=>[p[0],p[1]]);
      L.polyline(track,{color:'#fffdf7',weight:7,opacity:1,interactive:false}).addTo(map);
      const line = L.polyline(track,{color:'#bd5f42',weight:4,opacity:1,interactive:false}).addTo(map);
      bounds = line.getBounds();
      data.pois.forEach(poi => bounds.extend([poi.lat,poi.lon]));
      data.pois.forEach((poi,index) => {
        const popup = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = poi.name;
        const description = document.createElement('p');
        description.textContent = poi.description;
        popup.append(title,description);
        if (poi.url) {
          const link = document.createElement('a');
          link.href = poi.url; link.textContent = 'Visit website ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer';
          popup.append(link);
        }
        L.marker([poi.lat,poi.lon],{title:poi.name,alt:poi.name,icon:L.divIcon({className:'walk-poi-marker',html:`<span>${index+1}</span>`,iconSize:[30,30],iconAnchor:[15,15]})}).bindPopup(popup).addTo(map);
      });
      [track[0],track.at(-1)].forEach((point,i) => L.circleMarker(point,{radius:5,color:'#163e3a',fillColor:'#d3e48d',fillOpacity:1,weight:2}).bindTooltip(i?'Track finish':'Track start').addTo(map));
      map.fitBounds(bounds,{padding:[25,25]});
      explore.hidden = true;
      fit.hidden = false;
      fullscreen.hidden = typeof dialog.showModal !== 'function';
      status.textContent = 'Drag to explore; pinch or use + and − to zoom. Numbered markers match the places below.';
    } catch {
      if (map) map.remove();
      map = null;
      canvas.innerHTML = overview;
      fit.hidden = fullscreen.hidden = true;
      explore.disabled = false;
      status.textContent = 'The interactive map could not load. Use the route overview or download the GPX, then try again when connected.';
    }
  });
  fit.addEventListener('click',()=>map.fitBounds(bounds,{padding:[25,25]}));
  fullscreen.addEventListener('click',()=>{
    if(dialog.open){dialog.close();return;}
    pageScroll = window.scrollY;
    dialog.append(shell);
    try { dialog.showModal(); }
    catch { slot.append(shell); map.invalidateSize(); return; }
    document.documentElement.classList.add('stage-focus-open');
    fullscreen.textContent = 'Exit fullscreen ×';
    fullscreen.setAttribute('aria-expanded','true');
    map.invalidateSize();
    fullscreen.focus({preventScroll:true});
  });
  dialog.addEventListener('close',()=>{
    slot.append(shell);
    document.documentElement.classList.remove('stage-focus-open');
    fullscreen.textContent = 'Fullscreen ⛶';
    fullscreen.setAttribute('aria-expanded','false');
    map.invalidateSize();
    window.scrollTo({top:pageScroll,behavior:'instant'});
    fullscreen.focus({preventScroll:true});
  });
})();
