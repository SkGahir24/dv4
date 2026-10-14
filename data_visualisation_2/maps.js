const optionalNotes = new Proxy({}, { set(_, id, value) { const el = document.getElementById('note' + id); if (el) el.textContent = value; return true; } });
/* Three distinct geographic representations: council choropleth, point map, H3 hexbin. */
(async function initMaps(){
 const targets=[1,2,3].map(i=>document.getElementById('chart'+i));
 targets.forEach(el=>el.classList.add('map-chart'));
 const message=(i,s)=>{document.getElementById('chart'+i).innerHTML='<div class="map-message">'+escapeHtml(s)+'</div>';};
 if(typeof L==='undefined'){targets.forEach((_,i)=>message(i+1,'Leaflet could not load. Check your internet connection.'));return;}
 const create=(id,center,zoom)=>{const el=document.getElementById(id);el.innerHTML='';const map=L.map(el,{preferCanvas:true,scrollWheelZoom:false,attributionControl:false}).setView(center,zoom);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);L.control.attribution({prefix:false,position:'bottomright'}).addTo(map).addAttribution('© OpenStreetMap contributors');return map;};
 const get=async path=>{const r=await fetch(path);if(!r.ok)throw Error('Could not load '+path);return r.json();};
 const maps=[];
 const valid=d=>Number.isFinite(+d.Latitude)&&Number.isFinite(+d.Longitude)&&+d.Latitude>=-39.5&&+d.Latitude<=-33.8&&+d.Longitude>=140.8&&+d.Longitude<=150.1;
 const normalize=s=>String(s||'').toLowerCase().replace(/\b(city of|shire of|rural city of|borough of|council|city|shire|rural|municipal|municipality|the)\b/g,'').replace(/[^a-z0-9]/g,'').trim();
 try{
  const [facilities,parks]=await Promise.all([get('data/facilities.json'),get('data/parks.json')]);
  const points=facilities.filter(valid);const countByCouncil=new Map();
  for(const p of points){const n=normalize(p['LGA Name']);if(n)countByCouncil.set(n,(countByCouncil.get(n)||0)+1);}
  // 1. Real council polygons. A local GeoJSON file is preferred; the fallback uses geoBoundaries ADM2.
  const m1=create('chart1',[-37.5,144.7],7);maps.push(m1);
  try{
   // Try bundled boundaries first, then official Victorian government GeoJSON services.
   // Each source is independent, so one blocked endpoint will not break the map.
   const sources=[
     'data/victoria_lga.geojson',
     'https://maps.cfa.vic.gov.au/arcgis/rest/services/MOLViewer/MOLi_BaseBdy/MapServer/16/query?where=1%3D1&outFields=LGA_NAME%2CLGA_OFFICIAL_NAME&returnGeometry=true&outSR=4326&geometryPrecision=3&maxAllowableOffset=0.008&f=geojson',
     'https://maps.ffm.vic.gov.au/arcgis/rest/services/FPSP_Management/MapServer/1/query?where=1%3D1&outFields=LGA_NAME%2CLGA_OFFICIAL_NAME&returnGeometry=true&outSR=4326&geometryPrecision=3&maxAllowableOffset=0.008&f=geojson',
     'https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/VicPlan_Other/MapServer/1/query?where=1%3D1&outFields=LGA_NAME&returnGeometry=true&outSR=4326&geometryPrecision=3&maxAllowableOffset=0.008&f=geojson'
   ];
   const boundaryName=f=>String(f.properties?.LGA_NAME||f.properties?.LGA_OFFICIAL_NAME||f.properties?.LGA_NAME25||f.properties?.LGA_NAME24||f.properties?.shapeName||f.properties?.name||'');
   let boundary=null,shapes=[];
   for(const url of sources){
     try{
       const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),11000);
       let response;try{response=await fetch(url,{signal:controller.signal});}finally{clearTimeout(timeout);}
       if(!response.ok)throw Error('HTTP '+response.status);
       const candidate=await response.json();if(!Array.isArray(candidate.features))throw Error('No GeoJSON features');
       const matching=candidate.features.filter(f=>f.geometry&&countByCouncil.has(normalize(boundaryName(f))));
       if(!matching.length)throw Error('Council names do not match');
       boundary=candidate;shapes=matching;console.info('Choropleth loaded '+matching.length+' council polygons from '+url);break;
     }catch(err){console.warn('Boundary source unavailable:',url,err.message);}
   }
   if(!shapes.length)throw Error('Could not retrieve matching council boundaries. Place an official GeoJSON at data/victoria_lga.geojson for reliable offline loading.');
   const max=Math.max(...shapes.map(f=>countByCouncil.get(normalize(boundaryName(f)))||0));
   const palette=['#fff2d8','#f9d18e','#eeaa4c','#d67b20','#9d470d'];
   const color=v=>palette[Math.min(4,Math.floor((v/Math.max(1,max))*4.999))];
   const layer=L.geoJSON({type:'FeatureCollection',features:shapes},{style:f=>({color:'#fff',weight:1.1,fillColor:color(countByCouncil.get(normalize(boundaryName(f)))||0),fillOpacity:.83}),onEachFeature:(f,l)=>{const n=boundaryName(f);l.bindPopup('<b>'+escapeHtml(n)+'</b><br>'+((countByCouncil.get(normalize(n))||0).toLocaleString())+' recorded facilities');}}).addTo(m1);
   m1.fitBounds(layer.getBounds());
   const legend1=L.control({position:'bottomleft'});
   legend1.onAdd=function(){const div=L.DomUtil.create('div','map-legend');div.innerHTML='<strong>Facility count</strong><div class="legend-ramp"></div><div class="legend-labels"><span>0</span><span>'+max.toLocaleString()+'</span></div>';return div;};legend1.addTo(m1);
   optionalNotes[1] ='Each shaded council area represents its number of recorded recreation facilities. Darker shading indicates more recorded facilities, showing how provision differs across Victorian councils (counts are not adjusted for population).';
  }catch(e){console.warn('Choropleth boundary issue',e);message(1,'Choropleth boundaries unavailable: '+e.message);optionalNotes[1] ='This map compares recreation facility counts between Victorian councils using shaded council boundaries. The boundary data could not be loaded, so the choropleth cannot be displayed yet.';}
  // 2. Actual individual facility dots.
  const m2=create('chart2',[-37.6,144.8],7);maps.push(m2);
  const canvas=L.canvas({padding:.2});
  for(const p of points){L.circleMarker([+p.Latitude,+p.Longitude],{renderer:canvas,radius:3,weight:.5,color:'#9e4c1a',fillColor:'#e69a24',fillOpacity:.58}).bindPopup('<b>'+escapeHtml(p['Facility Name']||'Recreation facility')+'</b><br>'+escapeHtml(p['LGA Name']||'Victoria')).addTo(m2);}
  m2.fitBounds([[-39.3,140.9],[-33.9,150.1]]);const legend2=L.control({position:'bottomleft'});legend2.onAdd=function(){const div=L.DomUtil.create('div','map-legend');div.innerHTML='<span class="legend-dot"></span> Recorded facility location';return div;};legend2.addTo(m2);
  optionalNotes[2] ='Each dot marks a recorded recreation facility in Victoria. Clusters of dots show where facilities are concentrated; overlapping dots can represent multiple nearby facilities.';
  // 3. H3 hexagonal binning, rather than proportional circles or square grid.
  const m3=create('chart3',[-37.6,144.8],7);maps.push(m3);
  if(typeof h3==='undefined'){message(3,'H3 hexagon library could not load. Check internet access.');}
  else{
   const resolution=6,bins=new Map();
   for(const p of points){const id=h3.latLngToCell(+p.Latitude,+p.Longitude,resolution);bins.set(id,(bins.get(id)||0)+1);}
   const max=Math.max(1,...bins.values());
   const group=L.featureGroup();
   for(const [id,count] of bins){const coords=h3.cellToBoundary(id).map(([lat,lng])=>[lat,lng]);const ratio=count/max;const fill=ratio>.65?'#a34d0b':ratio>.3?'#d98120':ratio>.1?'#f0b253':'#ffe2a6';L.polygon(coords,{color:'#fffaf2',weight:.7,fillColor:fill,fillOpacity:.82}).bindPopup('<b>'+count.toLocaleString()+' facility records</b><br>H3 resolution 6 hexagon').addTo(group);}
   group.addTo(m3);m3.fitBounds([[-39.3,140.9],[-33.9,150.1]]);const legend3=L.control({position:'bottomleft'});legend3.onAdd=function(){const div=L.DomUtil.create('div','map-legend');div.innerHTML='<strong>Facilities per hexagon</strong><div class="legend-ramp"></div><div class="legend-labels"><span>Fewer</span><span>More</span></div>';return div;};legend3.addTo(m3);
   optionalNotes[3] ='The map groups recreation facilities into equal-sized hexagonal areas. Darker hexagons contain more recorded facilities, making geographic hotspots easier to identify.';
  }
  document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>maps.forEach(m=>m.invalidateSize()),120)));
  window.addEventListener('resize',()=>maps.forEach(m=>m.invalidateSize()));
 }catch(e){console.error('Maps failed:',e);targets.forEach((_,i)=>message(i+1,'Unable to load map data: '+e.message));}
})();
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
