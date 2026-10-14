// Shared tools used by Charts 4–10.
// Each chart has its own file in this folder.

const councilCharts = {
  files: {},
  year: '2024-25',
  years: ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'],

  async readData(fileName) {
    if (!this.files[fileName]) {
      const response = await fetch('data/' + fileName + '.json');
      if (!response.ok) {
        throw new Error('Could not open ' + fileName + '.json');
      }
      this.files[fileName] = await response.json();
    }
    return this.files[fileName];
  },

  getIndicator(rows, indicatorId) {
    return rows.filter(row =>
      row.ID === indicatorId && Number.isFinite(row.Result)
    );
  },

  axis(field, type = 'quantitative', title = undefined) {
    const setting = { field: field, type: type };
    if (title !== undefined) setting.title = title;
    return setting;
  },

  makeChart(mark, rows, encoding, options = {}) {
    return {
      background: 'transparent',
      width: 'container',
      height: 340,
      data: { values: rows },
      mark: mark,
      encoding: encoding,
      config: {
        view: { stroke: null },
        axis: {
          labelColor: '#43655e',
          titleColor: '#214c45',
          gridColor: '#e5efea'
        },
        legend: {
          labelColor: '#43655e',
          titleColor: '#214c45'
        }
      },
      ...options
    };
  },

  async showChart(number, specification) {
    const area = document.getElementById('chart' + number);
    if (!area) return;

    try {
      if (typeof vegaEmbed !== 'function') {
        throw new Error('Vega-Lite libraries did not load');
      }
      const rows = specification.data && specification.data.values;
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('No records available for this chart');
      }

      // Vega-Lite fits the chart to the space beside the explanation.
      const availableWidth = Math.max(260, area.clientWidth - 30);
      const finalChart = {
        ...specification,
        width: availableWidth,
        autosize: { type: 'fit', contains: 'padding' }
      };

      await vegaEmbed(area, finalChart, {
        actions: false,
        renderer: 'svg'
      });
      console.info('Chart ' + number + ' loaded');
    } catch (error) {
      console.error('Chart ' + number + ' could not load:', error);
      area.replaceChildren();
      const message = document.createElement('p');
      message.className = 'chart-error';
      message.textContent = 'Chart ' + number + ': ' + error.message;
      area.appendChild(message);
    }
  },

  showError(number, error) {
    const area = document.getElementById('chart' + number);
    console.error('Chart ' + number + ':', error);
    if (area) {
      area.textContent = 'Unable to load chart: ' + error.message;
    }
  }
};
