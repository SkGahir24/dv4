// Chart 6: Council service profile (spider / radar chart).
// Every axis is scaled separately to a 0–100 relative range.
async function drawChart6() {
  const performance = await councilCharts.readData('performance');
  const currentRows = performance.filter(row =>
    row.Year === councilCharts.year && Number.isFinite(row.Result)
  );

  const indicators = [
    { id: 'LB8', name: 'Library visits' },
    { id: 'WC5', name: 'Waste diverted' },
    { id: 'AF6', name: 'Aquatic use' },
    { id: 'G2', name: 'Consultation' }
  ];

  const councils = [...new Set(currentRows.map(row => row.Council))]
    .filter(council => indicators.every(indicator =>
      currentRows.some(row =>
        row.Council === council && row.ID === indicator.id
      )
    ))
    .sort();

  const area = document.getElementById('chart6');
  if (!councils.length) {
    area.textContent = 'No councils have all four indicator values.';
    return;
  }

  const ranges = {};
  for (const indicator of indicators) {
    const values = currentRows
      .filter(row => row.ID === indicator.id)
      .map(row => row.Result);
    ranges[indicator.id] = {
      low: Math.min(...values),
      high: Math.max(...values)
    };
  }

  area.innerHTML = `
    <div class="radar-controls">
      <label for="radar-council">Select a council</label>
      <select id="radar-council"></select>
    </div>
    <div id="radar-canvas"></div>
    <p class="radar-values" id="radar-values"></p>
  `;

  const dropdown = document.getElementById('radar-council');
  for (const council of councils) {
    const option = document.createElement('option');
    option.value = council;
    option.textContent = council;
    dropdown.appendChild(option);
  }

  // Work out where each axis point belongs on the circle.
  function pointOnCircle(position, distance, count) {
    const angle = -Math.PI / 2 + position * 2 * Math.PI / count;
    return [
      255 + Math.cos(angle) * distance,
      235 + Math.sin(angle) * distance
    ];
  }

  function drawSelectedCouncil(council) {
    const values = indicators.map(indicator => {
      const row = currentRows.find(item =>
        item.Council === council && item.ID === indicator.id
      );
      const range = ranges[indicator.id];
      const score = range.high > range.low
        ? 100 * (row.Result - range.low) / (range.high - range.low)
        : 50;
      return { name: indicator.name, original: row.Result, score: score };
    });

    function polygon(distances) {
      return distances.map((distance, index) =>
        pointOnCircle(index, distance, values.length).join(',')
      ).join(' ');
    }

    let svg = '<svg viewBox="0 0 510 480" role="img" ' +
      'aria-label="Radar chart of four council service indicators" ' +
      'style="width:100%;max-width:530px;overflow:visible">';

    // Draw five dotted guide rings.
    for (let ring = 1; ring <= 5; ring++) {
      const distances = values.map(() => 158 * ring / 5);
      svg += `<polygon points="${polygon(distances)}" fill="none" ` +
        'stroke="#e2cfb0" stroke-dasharray="4 5" stroke-width="1.5"/>';
    }

    // Draw the four axes and their labels.
    values.forEach((value, index) => {
      const end = pointOnCircle(index, 158, values.length);
      const label = pointOnCircle(index, 193, values.length);
      svg += `<line x1="255" y1="235" x2="${end[0]}" y2="${end[1]}" ` +
        'stroke="#dec9a9" stroke-dasharray="4 5"/>';
      svg += `<text x="${label[0]}" y="${label[1]}" text-anchor="middle" ` +
        `dominant-baseline="middle" font-size="15" font-weight="600" ` +
        `fill="#283f50">${value.name}</text>`;
    });

    const distances = values.map(value => value.score * 158 / 100);
    svg += `<polygon points="${polygon(distances)}" fill="#f2a01b" ` +
      'fill-opacity=".18" stroke="#db880e" stroke-width="3"/>';

    values.forEach((value, index) => {
      const point = pointOnCircle(index, distances[index], values.length);
      svg += `<circle cx="${point[0]}" cy="${point[1]}" r="5" ` +
        `fill="#db880e"><title>${value.name}: ${value.original.toFixed(2)}</title></circle>`;
    });

    document.getElementById('radar-canvas').innerHTML = svg + '</svg>';
    document.getElementById('radar-values').textContent = values
      .map(value => value.name + ': ' + value.original.toFixed(2))
      .join('  ·  ');
  }

  dropdown.value = councils.includes('Melbourne City')
    ? 'Melbourne City' : councils[0];
  dropdown.addEventListener('change', () => drawSelectedCouncil(dropdown.value));
  drawSelectedCouncil(dropdown.value);
}

drawChart6().catch(error => councilCharts.showError(6, error));
