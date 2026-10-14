// Chart 8: Library membership versus visits, with a line of best fit.
async function drawChart8() {
  const performance = await councilCharts.readData('performance');
  const latest = performance.filter(row =>
    row.Year === councilCharts.year && Number.isFinite(row.Result)
  );

  const membership = latest.filter(row => row.ID === 'LB7');
  const visits = latest.filter(row => row.ID === 'LB8');
  const visitsByCouncil = new Map(
    visits.map(row => [row.Council, row.Result])
  );

  const chartRows = membership
    .filter(row => visitsByCouncil.has(row.Council))
    .map(row => ({
      Council: row.Council,
      Membership: row.Result,
      Visits: visitsByCouncil.get(row.Council),
      Group: row.Group
    }));

  const chart = councilCharts.makeChart('circle', chartRows, {}, {
    layer: [
      {
        mark: { type: 'circle', size: 90, opacity: 0.75 },
        encoding: {
          x: councilCharts.axis('Membership', 'quantitative', 'Library membership indicator'),
          y: councilCharts.axis('Visits', 'quantitative', 'Library visits per resident'),
          color: { field: 'Group', type: 'nominal' },
          tooltip: [
            { field: 'Council' },
            { field: 'Membership' },
            { field: 'Visits' }
          ]
        }
      },
      {
        transform: [{ regression: 'Visits', on: 'Membership' }],
        mark: { type: 'line', color: '#b42318', strokeWidth: 3 },
        encoding: {
          x: { field: 'Membership', type: 'quantitative' },
          y: { field: 'Visits', type: 'quantitative' }
        }
      }
    ]
  });

  // A layered Vega-Lite chart must not also have a top-level mark.
  delete chart.mark;
  delete chart.encoding;
  await councilCharts.showChart(8, chart);
}

drawChart8().catch(error => councilCharts.showError(8, error));
