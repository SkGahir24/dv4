// Chart 9: Council assets and liabilities over time (stacked bars).
async function drawChart9() {
  const finance = await councilCharts.readData('finance');
  const categories = [
    'Current assets',
    'Non-current assets',
    'Current liabilities',
    'Non-current liabilities'
  ];

  const totals = {};
  for (const row of finance) {
    if (!categories.includes(row.Category) || !Number.isFinite(row.Value)) {
      continue;
    }
    const key = row.Year + '|' + row.Category;
    totals[key] = (totals[key] || 0) + row.Value;
  }

  const chartRows = Object.entries(totals).map(([key, value]) => {
    const [year, category] = key.split('|');
    return { Year: year, Category: category, Value: value };
  });

  const chart = councilCharts.makeChart('bar', chartRows, {
    x: councilCharts.axis('Year', 'ordinal', 'Financial year'),
    y: councilCharts.axis('Value', 'quantitative', 'Aggregate reported amount ($)'),
    color: { field: 'Category', type: 'nominal' },
    tooltip: [
      { field: 'Year' },
      { field: 'Category' },
      { field: 'Value', format: ',.0f' }
    ]
  });

  await councilCharts.showChart(9, chart);
}

drawChart9().catch(error => councilCharts.showError(9, error));
