VICTORIAN COUNCIL SERVICES — READABLE SOURCE CODE

HOW TO RUN
1. Open this entire folder in VS Code.
2. Open index.html with the Live Server extension.
3. Keep the data folder beside index.html.
4. An internet connection is needed for Leaflet, H3, Vega and the map tiles.

WHERE THE CODE IS
- index.html: page headings, cards, explanations, and links to scripts.
- styles.css: website colours, fonts, spacing, and layout.
- site.js: search and category filter buttons.
- maps.js: the three geographic maps (choropleth, dots, hexagons).
- charts/common.js: small shared functions for loading data and showing charts.
- charts/chart4.js: library visits heatmap.
- charts/chart5.js: waste collection area chart.
- charts/chart6.js: interactive council spider/radar chart.
- charts/chart7.js: connected dot plot of library costs.
- charts/chart8.js: membership vs visits scatter plot with trend line.
- charts/chart9.js: financial position stacked bars.
- charts/chart10.js: consultation satisfaction annual heatmap.
- data/: the unchanged JSON datasets used by the website.

Each chart is in its own file, uses simple variable names, and includes
short comments explaining what it does. Each chart loads separately.

NOTES
- The map code still uses Leaflet and H3, which have some necessary
  specialist functions.
- The choropleth still requires valid council GeoJSON boundaries.
  For reliable local loading, add data/victoria_lga.geojson.
- This is a readability refactor. The chart data and intended chart
  designs have been kept, but full browser rendering has not been verified.
