// Chart 4: Library visits per resident (heatmap).
async function drawChart4() {
  const performance = await councilCharts.readData('performance');
  const libraryVisits = councilCharts.getIndicator(performance, 'LB8');

  // Show the 18 councils with the highest reported value in 2024–25.
  const currentYear = libraryVisits
    .filter(row => row.Year === councilCharts.year)
    .sort((first, second) => second.Result - first.Result);

  const selectedCouncils = [...new Set(
    currentYear.slice(0, 18).map(row => row.Council)
  )];

  const chartRows = libraryVisits.filter(row =>
    selectedCouncils.includes(row.Council)
  );

  const chart = councilCharts.makeChart('rect', chartRows, {
    x: councilCharts.axis('Year', 'ordinal', 'Financial year'),
    y: {
      field: 'Council',
      type: 'nominal',
      sort: selectedCouncils,
      title: null
    },
    color: {
      field: 'Result',
      type: 'quantitative',
      title: 'Visits per resident',
      scale: { scheme: 'yelloworangered' }
    },
    tooltip: [
      { field: 'Council' },
      { field: 'Year' },
      { field: 'Result', format: '.2f' }
    ]
  }, { height: 470 });

  await councilCharts.showChart(4, chart);
}

drawChart4().catch(error => councilCharts.showError(4, error));
