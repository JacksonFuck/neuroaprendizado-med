/* ============================================================
   charts.js — Dashboard Visualization Module
   Uses Chart.js (global CDN) + custom DOM heatmap
   ============================================================ */

// --------------- Chart instance registry ---------------
const chartInstances = {
  focusWeekly: null,
  retention: null,
  nBackProgression: null,
  reviewAccuracy: null,
};

// --------------- Color tokens ---------------
const COLORS = {
  cyan: '#00f0ff',
  magenta: '#e040fb',
  gold: '#ffbe0b',
  green: '#00e676',
  blue: '#3a86ff',
  text: '#c5d0e6',
  gridLine: 'rgba(0,240,255,0.1)',
};

// --------------- Helpers ---------------

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function destroyChart(key) {
  if (chartInstances[key]) {
    chartInstances[key].destroy();
    chartInstances[key] = null;
  }
}

function getCtx(canvasId) {
  const el = document.getElementById(canvasId);
  return el ? el.getContext('2d') : null;
}

// --------------- Chart.js dark theme defaults ---------------

function configureChartDefaults() {
  Chart.defaults.color = COLORS.text;
  Chart.defaults.borderColor = COLORS.gridLine;
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(10,12,28,0.92)';
  Chart.defaults.plugins.tooltip.titleColor = COLORS.cyan;
  Chart.defaults.plugins.tooltip.bodyColor = COLORS.text;
  Chart.defaults.plugins.tooltip.borderColor = COLORS.cyan;
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 4;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.scale.grid = {
    color: COLORS.gridLine,
    drawBorder: false,
  };
}

// --------------- Initialization ---------------

async function initCharts() {
  configureChartDefaults();

  await Promise.all([
    renderFocusWeeklyChart(),
    renderRetentionChart(),
    renderNBackProgressionChart(),
    renderReviewAccuracyChart(),
    renderStreakHeatmap(),
  ]);
}

// --------------- 1. Focus Weekly — Bar Chart ---------------

async function renderFocusWeeklyChart() {
  const data = await fetchJSON('/api/charts/focus-weekly');
  if (!data || data.length === 0) return;

  destroyChart('focusWeekly');
  const ctx = getCtx('chartFocusWeekly');
  if (!ctx) return;

  const labels = data.map((d) => d.week.replace('2026-', ''));
  const values = data.map((d) => d.minutes);
  const hours = values.map((m) => +(m / 60).toFixed(1));

  chartInstances.focusWeekly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Horas de foco',
          data: hours,
          backgroundColor: createGradientBar(ctx, COLORS.cyan, 'rgba(0,240,255,0.15)'),
          borderColor: COLORS.cyan,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (tip) => `${tip.raw}h (${values[tip.dataIndex]} min)`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Semana' },
          ticks: { maxRotation: 0 },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Horas' },
        },
      },
    },
  });
}

function createGradientBar(ctx, topColor, bottomColor) {
  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  return gradient;
}

// --------------- 2. Retention — Line Chart ---------------

async function renderRetentionChart() {
  const data = await fetchJSON('/api/charts/retention');
  if (!data || data.length === 0) return;

  destroyChart('retention');
  const ctx = getCtx('chartRetention');
  if (!ctx) return;

  const labels = data.map((d) => d.week.replace('2026-', ''));
  const values = data.map((d) => d.avg_retrievability);

  chartInstances.retention = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Recuperabilidade (%)',
          data: values,
          borderColor: COLORS.magenta,
          backgroundColor: 'rgba(224,64,251,0.10)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: COLORS.magenta,
          pointBorderColor: COLORS.magenta,
          pointRadius: 4,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (tip) => `${tip.raw}%`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Semana' },
          ticks: { maxRotation: 0 },
        },
        y: {
          min: 0,
          max: 100,
          title: { display: true, text: 'Recuperabilidade (%)' },
          ticks: { callback: (v) => v + '%' },
        },
      },
    },
  });
}

// --------------- 3. N-Back Progression — Line Chart ---------------

async function renderNBackProgressionChart() {
  const data = await fetchJSON('/api/charts/nback-progression');
  if (!data || data.length === 0) return;

  destroyChart('nBackProgression');
  const ctx = getCtx('chartNBackProgression');
  if (!ctx) return;

  const labels = data.map((d) => d.date);
  const accuracy = data.map((d) => d.accuracy_pct);
  const nLevels = data.map((d) => d.n_level);

  chartInstances.nBackProgression = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Precisão (%)',
          data: accuracy,
          borderColor: COLORS.gold,
          backgroundColor: 'rgba(255,190,11,0.10)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: COLORS.gold,
          pointBorderColor: COLORS.gold,
          pointRadius: 3,
          pointHoverRadius: 6,
          yAxisID: 'yAccuracy',
        },
        {
          label: 'Nível N',
          data: nLevels,
          borderColor: COLORS.blue,
          borderDash: [6, 3],
          backgroundColor: 'transparent',
          tension: 0,
          pointBackgroundColor: COLORS.blue,
          pointBorderColor: COLORS.blue,
          pointRadius: 3,
          pointHoverRadius: 6,
          yAxisID: 'yLevel',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (tip) => {
              if (tip.datasetIndex === 0) return `Precisão: ${tip.raw}%`;
              return `Nível: ${tip.raw}-back`;
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Data' },
          ticks: {
            maxRotation: 45,
            maxTicksLimit: 12,
          },
        },
        yAccuracy: {
          type: 'linear',
          position: 'left',
          min: 0,
          max: 100,
          title: { display: true, text: 'Precisão (%)' },
          ticks: { callback: (v) => v + '%' },
        },
        yLevel: {
          type: 'linear',
          position: 'right',
          min: 0,
          suggestedMax: 6,
          title: { display: true, text: 'Nível N' },
          grid: { drawOnChartArea: false },
          ticks: { stepSize: 1 },
        },
      },
    },
  });
}

// --------------- 4. Review Accuracy — Doughnut Chart ---------------

async function renderReviewAccuracyChart() {
  const data = await fetchJSON('/api/charts/review-accuracy');
  if (!data) return;

  const total = (data.again || 0) + (data.hard || 0) + (data.good || 0) + (data.easy || 0);
  if (!total || isNaN(total)) {
    const canvas = document.getElementById('chartReviewAccuracy');
    if (canvas) {
      const parent = canvas.parentElement;
      if (parent) parent.style.display = 'none';
    }
    return;
  }

  destroyChart('reviewAccuracy');
  const ctx = getCtx('chartReviewAccuracy');
  if (!ctx) return;

  chartInstances.reviewAccuracy = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['De novo', 'Difícil', 'Bom', 'Fácil'],
      datasets: [
        {
          data: [data.again, data.hard, data.good, data.easy],
          backgroundColor: [COLORS.magenta, COLORS.gold, COLORS.cyan, COLORS.green],
          borderColor: 'rgba(10,12,28,0.9)',
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: (tip) => {
              const pct = ((tip.raw / total) * 100).toFixed(1);
              return ` ${tip.label}: ${tip.raw} (${pct}%)`;
            },
          },
        },
      },
    },
    plugins: [
      {
        id: 'doughnutCenterText',
        beforeDraw(chart) {
          const { width, height, ctx: drawCtx } = chart;
          drawCtx.save();
          drawCtx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
          drawCtx.fillStyle = COLORS.text;
          drawCtx.textAlign = 'center';
          drawCtx.textBaseline = 'middle';
          drawCtx.fillText(total.toLocaleString('pt-BR'), width / 2, height / 2 - 8);
          drawCtx.font = "12px 'Plus Jakarta Sans', sans-serif";
          drawCtx.fillStyle = 'rgba(197,208,230,0.6)';
          drawCtx.fillText('revisões', width / 2, height / 2 + 14);
          drawCtx.restore();
        },
      },
    ],
  });
}

// --------------- 5. Streak Heatmap — Custom DOM ---------------

async function renderStreakHeatmap() {
  const container = document.getElementById('streakHeatmap');
  if (!container) return;

  const data = await fetchJSON('/api/charts/streak-heatmap');
  container.innerHTML = '';

  const WEEKS = 53;
  const DAYS = 7;
  const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

  // Build date->entry lookup
  const lookup = {};
  if (data && data.length > 0) {
    data.forEach((entry) => {
      lookup[entry.date] = entry;
    });
  }

  // Compute the date grid: 53 weeks ending on today
  const today = new Date();
  const todayDow = (today.getDay() + 6) % 7; // Monday=0
  const endDate = new Date(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS * 7 - 1) - todayDow);

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'heatmap-wrapper';
  wrapper.style.cssText = 'display:grid; grid-template-columns: 32px 1fr; gap:0; overflow-x:auto;';

  // Day labels column
  const dayLabelsCol = document.createElement('div');
  dayLabelsCol.style.cssText = `
    display:grid;
    grid-template-rows: 20px repeat(${DAYS}, 13px);
    gap:2px;
    align-items:center;
    padding-right:4px;
  `;
  // Empty top-left corner
  const cornerCell = document.createElement('div');
  dayLabelsCol.appendChild(cornerCell);
  DAY_LABELS.forEach((label) => {
    const lbl = document.createElement('div');
    lbl.textContent = label;
    lbl.style.cssText = `
      font-size:9px;
      color:rgba(197,208,230,0.5);
      text-align:right;
      line-height:13px;
    `;
    dayLabelsCol.appendChild(lbl);
  });
  wrapper.appendChild(dayLabelsCol);

  // Grid area (month labels row + cells)
  const gridArea = document.createElement('div');
  gridArea.style.cssText = `
    display:grid;
    grid-template-columns: repeat(${WEEKS}, 13px);
    grid-template-rows: 20px repeat(${DAYS}, 13px);
    gap:2px;
  `;

  // Month labels row
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthHeaders = new Array(WEEKS).fill('');

  for (let w = 0; w < WEEKS; w++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + w * 7);
    if (w === 0 || weekStart.getDate() <= 7) {
      monthHeaders[w] = monthNames[weekStart.getMonth()];
    }
  }

  monthHeaders.forEach((label) => {
    const mCell = document.createElement('div');
    mCell.textContent = label;
    mCell.style.cssText = `
      font-size:9px;
      color:rgba(197,208,230,0.5);
      line-height:20px;
      text-align:left;
    `;
    gridArea.appendChild(mCell);
  });

  // Tooltip element
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position:fixed;
    pointer-events:none;
    background:rgba(10,12,28,0.95);
    border:1px solid rgba(0,240,255,0.3);
    color:#c5d0e6;
    font-size:11px;
    padding:4px 8px;
    border-radius:4px;
    z-index:9999;
    display:none;
    white-space:nowrap;
    font-family:'Plus Jakarta Sans', sans-serif;
  `;
  document.body.appendChild(tooltip);

  // Day cells
  for (let d = 0; d < DAYS; d++) {
    for (let w = 0; w < WEEKS; w++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(cellDate.getDate() + w * 7 + d);

      const dateStr = formatDate(cellDate);
      const entry = lookup[dateStr];
      const minutes = entry ? entry.minutes : 0;
      const sessions = entry ? entry.sessions : 0;

      const cell = document.createElement('div');
      cell.style.cssText = `
        width:11px;
        height:11px;
        border-radius:2px;
        background:${getHeatColor(minutes)};
        cursor:pointer;
        transition:outline 0.15s ease;
      `;

      // Future dates are dimmer
      if (cellDate > today) {
        cell.style.background = 'transparent';
        cell.style.cursor = 'default';
      }

      cell.addEventListener('mouseenter', (e) => {
        if (cellDate > today) return;
        tooltip.style.display = 'block';
        tooltip.innerHTML = `<strong>${formatDateBR(cellDate)}</strong><br>${minutes} min &middot; ${sessions} sessão${sessions !== 1 ? 'es' : ''}`;
        positionTooltip(e, tooltip);
      });

      cell.addEventListener('mousemove', (e) => {
        positionTooltip(e, tooltip);
      });

      cell.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });

      gridArea.appendChild(cell);
    }
  }

  wrapper.appendChild(gridArea);
  container.appendChild(wrapper);
}

function getHeatColor(minutes) {
  if (minutes <= 0) return 'rgba(197,208,230,0.04)';
  if (minutes <= 30) return '#0e4429';
  if (minutes <= 60) return '#006d32';
  if (minutes <= 120) return '#00e676';
  return '#00f0ff';
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateBR(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function positionTooltip(event, tooltip) {
  const offsetX = 12;
  const offsetY = -28;
  tooltip.style.left = event.clientX + offsetX + 'px';
  tooltip.style.top = event.clientY + offsetY + 'px';
}

// --------------- CSV Export ---------------

function exportCSV(type) {
  const link = document.createElement('a');
  link.href = `/api/export/csv?type=${encodeURIComponent(type)}`;
  link.download = '';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
