// Chart 7: Connect each council's annual library cost values with a line.
async function drawChart7() {
  const performance = await councilCharts.readData('performance');
  const libraryCosts = councilCharts.getIndicator(performance, 'LB5')
    .filter(row => row.Result >= 0);

  const latestCosts = libraryCosts
    .filter(row => row.Year === councilCharts.year)
    .sort((first, second) => second.Result - first.Result);

  const councils = [...new Set(
    latestCosts.slice(0, 6).map(row => row.Council)
  )];
  const chartRows = libraryCosts.filter(row => councils.includes(row.Council));

  const chart = councilCharts.makeChart({
    type: 'line',
    point: { filled: true, size: 85 },
    strokeWidth: 2.5
  }, chartRows, {
    x: {
      field: 'Year',
      type: 'ordinal',
      title: 'Financial year',
      sort: councilCharts.years
    },
    y: councilCharts.axis('Result', 'quantitative', 'Direct library service cost (LGPRF LB5)'),
    color: { field: 'Council', type: 'nominal', title: 'Council' },
    detail: { field: 'Council', type: 'nominal' },
    tooltip: [
      { field: 'Council' },
      { field: 'Year' },
      { field: 'Result', type: 'quantitative', format: ',.2f' }
    ]
  });

  await councilCharts.showChart(7, chart);
}

drawChart7().catch(error => councilCharts.showError(7, error));
