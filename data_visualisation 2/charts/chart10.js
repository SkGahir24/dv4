// Chart 10: Community consultation satisfaction by council and year.
// This is a financial-year heatmap, not a daily calendar.
async function drawChart10() {
  const performance = await councilCharts.readData('performance');
  const satisfaction = councilCharts.getIndicator(performance, 'G2');

  const councilsWithRecentData = [...new Set(
    satisfaction
      .filter(row => row.Year === councilCharts.year)
      .map(row => row.Council)
  )];

  // Keep councils with at least three reported years.
  const eligibleCouncils = councilsWithRecentData
    .map(name => ({
      name: name,
      rows: satisfaction.filter(row =>
        row.Council === name && councilCharts.years.includes(row.Year)
      ),
      latest: satisfaction.find(row =>
        row.Council === name && row.Year === councilCharts.year
      )?.Result
    }))
    .filter(council =>
      council.rows.length >= 3 && Number.isFinite(council.latest)
    )
    .sort((first, second) => second.latest - first.latest)
    .slice(0, 12);

  const selectedNames = eligibleCouncils.map(council => council.name);
  const chartRows = satisfaction.filter(row =>
    selectedNames.includes(row.Council) && councilCharts.years.includes(row.Year)
  );

  const scores = chartRows.map(row => row.Result);
  if (!scores.length) throw new Error('No consultation satisfaction scores');

  // Use the observed range to make yellow, orange and red distinct.
  const low = Math.floor(Math.min(...scores) / 5) * 5;
  const high = Math.ceil(Math.max(...scores) / 5) * 5;
  const middle = (low + high) / 2;

  const chart = councilCharts.makeChart({
    type: 'rect',
    stroke: '#fffaf2',
    strokeWidth: 3,
    cornerRadius: 5
  }, chartRows, {
    x: {
      field: 'Year',
      type: 'ordinal',
      sort: councilCharts.years,
      title: 'Financial year',
      axis: { labelAngle: 0, labelFontSize: 12 }
    },
    y: {
      field: 'Council',
      type: 'nominal',
      sort: selectedNames,
      title: null,
      axis: { labelLimit: 175 }
    },
    color: {
      field: 'Result',
      type: 'quantitative',
      title: 'Satisfaction score',
      scale: {
        domain: [low, middle, high],
        range: ['#ffe45e', '#ff932e', '#c8241b'],
        clamp: true
      },
      legend: {
        orient: 'bottom',
        gradientLength: 230,
        title: 'Satisfaction score (observed range)'
      }
    },
    tooltip: [
      { field: 'Council', type: 'nominal' },
      { field: 'Year', type: 'ordinal', title: 'Financial year' },
      {
        field: 'Result',
        type: 'quantitative',
        title: 'Consultation satisfaction',
        format: '.1f'
      }
    ]
  }, { height: 410 });

  await councilCharts.showChart(10, chart);
}

drawChart10().catch(error => councilCharts.showError(10, error));
