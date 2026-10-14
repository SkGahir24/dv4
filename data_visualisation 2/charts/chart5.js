// Chart 5: Total garbage collected in each financial year (area chart).
async function drawChart5() {
  const wasteData = await councilCharts.readData('waste');
  const totalsByYear = {};

  for (const row of wasteData) {
    const tonnes = Number(row.garbage_collected_total_tonnes);
    if (!Number.isFinite(tonnes)) continue;

    const year = row.financial_year;
    totalsByYear[year] = (totalsByYear[year] || 0) + tonnes;
  }

  const chartRows = Object.entries(totalsByYear)
    .map(([year, tonnes]) => ({ Year: year, Tonnes: tonnes }))
    .sort((first, second) => first.Year.localeCompare(second.Year));

  const chart = councilCharts.makeChart({
    type: 'area',
    line: { color: '#c67a16' },
    point: { filled: true, fill: '#d48a16', size: 55 },
    opacity: 0.65,
    color: '#f4bb65'
  }, chartRows, {
    x: councilCharts.axis('Year', 'ordinal', 'Financial year'),
    y: councilCharts.axis('Tonnes', 'quantitative', 'Reported garbage collected (tonnes)'),
    tooltip: [
      { field: 'Year' },
      { field: 'Tonnes', format: ',.0f' }
    ]
  });

  await councilCharts.showChart(5, chart);
}

drawChart5().catch(error => councilCharts.showError(5, error));
