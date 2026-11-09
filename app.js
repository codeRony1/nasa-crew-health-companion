/**
 * Crew Health Companion - Application Engine
 * NASA Space Apps Challenge
 */

(function () {
  'use strict';

  // LocalStorage Key
  const STORAGE_KEY = 'crew_health_readings_v3';

  // Application State
  const state = {
    readings: [], // Real timestamped readings logged by the astronaut
    currentEnv: 'iss',
    currentLayer: 'all',
    missionSol: 1,
    streak: 0,
    xp: 0,
    unlockedBadges: [],
    selectedRegion: null,
    selectedMetricKey: null,
    chartInstance: null
  };

  /* ==========================================================================
     1. INITIALIZATION & DATA PERSISTENCE
     ========================================================================== */
  function init() {
    loadSavedData();
    initStarfield();
    initMETClock();
    setupEventListeners();
    updateMissionEnvironment(state.currentEnv);
    refreshAllUI();
  }

  function loadSavedData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        state.readings = Array.isArray(parsed.readings) ? parsed.readings : [];
        state.currentEnv = parsed.currentEnv || 'iss';
        state.streak = parsed.streak || 0;
        state.xp = parsed.xp || 0;
        state.unlockedBadges = Array.isArray(parsed.unlockedBadges) ? parsed.unlockedBadges : [];
      } else {
        // Initial clean zero-data state: NO preset readings
        state.readings = [];
        state.streak = 0;
        state.xp = 0;
        state.unlockedBadges = [];
      }
    } catch (err) {
      console.warn('Error reading from localStorage:', err);
      state.readings = [];
    }
  }

  function saveCurrentData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        readings: state.readings,
        currentEnv: state.currentEnv,
        streak: state.streak,
        xp: state.xp,
        unlockedBadges: state.unlockedBadges
      }));
    } catch (err) {
      console.warn('Error saving to localStorage:', err);
    }
  }

  /* ==========================================================================
     2. READINGS, STATUS EVALUATION & COMPARATIVE DELTAS
     ========================================================================== */
  function getRegionReadings(regionId) {
    return state.readings
      .filter(r => r.regionId === regionId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  function getLatestRegionReading(regionId) {
    const list = getRegionReadings(regionId);
    return list.length > 0 ? list[list.length - 1] : null;
  }

  function getPreviousRegionReading(regionId) {
    const list = getRegionReadings(regionId);
    return list.length > 1 ? list[list.length - 2] : null;
  }

  /**
   * Determine single metric status: 'normal' | 'caution' | 'critical'
   */
  function evaluateMetricStatus(metricKey, value) {
    const ref = window.REFERENCE_RANGES[metricKey];
    if (!ref || value === undefined || value === null) return 'normal';

    if (ref.criticalLow !== undefined && value < ref.criticalLow) return 'critical';
    if (ref.criticalHigh !== undefined && value > ref.criticalHigh) return 'critical';
    if (value >= ref.normalMin && value <= ref.normalMax) return 'normal';

    return 'caution';
  }

  /**
   * Determine overall status of a reading or region: 'nodata' | 'normal' | 'caution' | 'critical'
   */
  function getRegionStatus(regionId) {
    const latest = getLatestRegionReading(regionId);
    if (!latest || !latest.values) {
      return { status: 'nodata', failedMetric: null, reading: null };
    }

    let worstStatus = 'normal';
    let failedMetric = null;

    Object.keys(latest.values).forEach(metricKey => {
      const val = latest.values[metricKey];
      if (val !== null && val !== undefined) {
        const st = evaluateMetricStatus(metricKey, val);
        if (st === 'critical') {
          worstStatus = 'critical';
          failedMetric = metricKey;
        } else if (st === 'caution' && worstStatus !== 'critical') {
          worstStatus = 'caution';
          failedMetric = metricKey;
        }
      }
    });

    return {
      status: worstStatus,
      failedMetric: failedMetric,
      reading: latest
    };
  }

  /**
   * Crew Readiness Score: Computed dynamically ONLY from logged regions
   */
  function calculateCrewReadinessScore() {
    const allRegions = Object.keys(window.BODY_REGIONS);
    const loggedRegions = allRegions.filter(rId => getLatestRegionReading(rId) !== null);

    if (loggedRegions.length === 0) {
      return { score: null, loggedCount: 0, totalCount: 8 };
    }

    let totalScore = 0;
    loggedRegions.forEach(rId => {
      const statusInfo = getRegionStatus(rId);
      if (statusInfo.status === 'normal') totalScore += 100;
      else if (statusInfo.status === 'caution') totalScore += 75;
      else if (statusInfo.status === 'critical') totalScore += 35;
    });

    const average = Math.round(totalScore / loggedRegions.length);
    return {
      score: Math.max(0, Math.min(100, average)),
      loggedCount: loggedRegions.length,
      totalCount: 8
    };
  }

  /* ==========================================================================
     3. MASTER UI REFRESH
     ========================================================================== */
  function refreshAllUI() {
    renderReadinessHUD();
    renderSummaryCards();
    renderSVGRegions();
    renderCheckinBanner();
    renderGamificationHUD();
  }

  function renderReadinessHUD() {
    const readiness = calculateCrewReadinessScore();
    const valEl = document.getElementById('readiness-score-val');
    const badgeEl = document.getElementById('readiness-badge');
    const subEl = document.getElementById('readiness-subtext');
    const barEl = document.getElementById('readiness-gauge-bar');

    const totalCircumference = 264;

    if (readiness.score === null) {
      // Zero-Data Initial State
      if (valEl) valEl.textContent = '--';
      if (barEl) {
        barEl.style.strokeDashoffset = totalCircumference;
        barEl.style.stroke = 'var(--status-gray)';
      }
      if (badgeEl) {
        badgeEl.textContent = 'NOT ENOUGH DATA';
        badgeEl.style.color = 'var(--status-gray)';
      }
      if (subEl) {
        subEl.textContent = 'Click a body part to start your check-up.';
      }
      return;
    }

    // Has at least 1 reading
    if (valEl) valEl.textContent = readiness.score;
    const offset = totalCircumference - (totalCircumference * (readiness.score / 100));
    if (barEl) barEl.style.strokeDashoffset = offset;

    const unmeasured = readiness.totalCount - readiness.loggedCount;
    if (subEl) {
      subEl.textContent = `Based on ${readiness.loggedCount} of 8 systems (${unmeasured} unmeasured)`;
    }

    if (readiness.score >= 90) {
      if (badgeEl) {
        badgeEl.textContent = 'PRIME / NOMINAL';
        badgeEl.style.color = 'var(--status-green)';
      }
      if (barEl) barEl.style.stroke = 'var(--status-green)';
    } else if (readiness.score >= 70) {
      if (badgeEl) {
        badgeEl.textContent = 'CAUTION ADVISORY';
        badgeEl.style.color = 'var(--status-yellow)';
      }
      if (barEl) barEl.style.stroke = 'var(--status-yellow)';
    } else {
      if (badgeEl) {
        badgeEl.textContent = 'CRITICAL ATTENTION';
        badgeEl.style.color = 'var(--status-red)';
      }
      if (barEl) barEl.style.stroke = 'var(--status-red)';
    }
  }

  function renderSummaryCards() {
    Object.keys(window.BODY_REGIONS).forEach(rId => {
      const reg = window.BODY_REGIONS[rId];
      const statusInfo = getRegionStatus(rId);
      const card = document.querySelector(`.system-summary-card[data-region="${rId}"]`);
      const pill = document.getElementById(`card-pill-${rId}`);
      const dot = document.getElementById(`card-dot-${rId}`);

      if (card) {
        card.classList.remove('status-nodata', 'status-normal', 'status-caution', 'status-critical');
        card.classList.add(`status-${statusInfo.status}`);
      }

      if (pill) {
        pill.textContent = statusInfo.status === 'nodata' ? 'NO DATA' : statusInfo.status.toUpperCase();
        pill.className = `card-status-pill ${statusInfo.status}`;
      }

      if (dot) {
        if (statusInfo.status === 'nodata') dot.style.backgroundColor = 'var(--status-gray)';
        else if (statusInfo.status === 'normal') dot.style.backgroundColor = 'var(--status-green)';
        else if (statusInfo.status === 'caution') dot.style.backgroundColor = 'var(--status-yellow)';
        else dot.style.backgroundColor = 'var(--status-red)';
      }

      // Update card values or show "--"
      const reading = statusInfo.reading;
      updateCardMetricValues(rId, reading ? reading.values : null);
    });
  }

  function updateCardMetricValues(regionId, values) {
    if (!values) {
      if (regionId === 'brain') {
        setText('vital-brain-sleep', '--');
        setText('vital-brain-mood', '--');
      } else if (regionId === 'eyes') {
        setText('vital-eyes-score', '--');
        setText('vital-eyes-headache', '--');
      } else if (regionId === 'heart') {
        setText('vital-heart-hr', '--');
        setText('vital-heart-bp', '--');
      } else if (regionId === 'lungs') {
        setText('vital-lungs-spo2', '--');
        setText('vital-lungs-resp', '--');
      } else if (regionId === 'gut') {
        setText('vital-gut-glucose', '--');
        setText('vital-gut-hydration', '--');
      } else if (regionId === 'spine') {
        setText('vital-spine-exercise', '--');
        setText('vital-spine-pain', '--');
      } else if (regionId === 'muscles') {
        setText('vital-muscles-exercise', '--');
        setText('vital-muscles-weakness', '--');
      } else if (regionId === 'immune') {
        setText('vital-immune-temp', '--');
        setText('vital-immune-skin', '--');
      }
      return;
    }

    if (regionId === 'brain') {
      setText('vital-brain-sleep', values.sleepHours !== undefined ? `${Number(values.sleepHours).toFixed(1)} hrs` : '--');
      setText('vital-brain-mood', values.moodScore !== undefined ? `${values.moodScore} / 10` : '--');
    } else if (regionId === 'eyes') {
      setText('vital-eyes-score', values.visionScore !== undefined ? `${values.visionScore} / 10` : '--');
      setText('vital-eyes-headache', values.headachePresent !== undefined ? (values.headachePresent == 1 ? 'Yes' : 'No') : '--');
    } else if (regionId === 'heart') {
      setText('vital-heart-hr', values.heartRate !== undefined ? `${Math.round(values.heartRate)} bpm` : '--');
      const bpStr = (values.systolicBP !== undefined || values.diastolicBP !== undefined)
        ? `${values.systolicBP !== undefined ? Math.round(values.systolicBP) : '--'} / ${values.diastolicBP !== undefined ? Math.round(values.diastolicBP) : '--'}`
        : '--';
      setText('vital-heart-bp', bpStr);
    } else if (regionId === 'lungs') {
      setText('vital-lungs-spo2', values.spo2 !== undefined ? `${Math.round(values.spo2)}%` : '--');
      setText('vital-lungs-resp', values.respirationRate !== undefined ? `${Math.round(values.respirationRate)} /min` : '--');
    } else if (regionId === 'gut') {
      setText('vital-gut-glucose', values.bloodGlucose !== undefined ? `${Math.round(values.bloodGlucose)} mg/dL` : '--');
      setText('vital-gut-hydration', values.hydrationLitres !== undefined ? `${Number(values.hydrationLitres).toFixed(1)} L` : '--');
    } else if (regionId === 'spine') {
      setText('vital-spine-exercise', values.exerciseMinutes !== undefined ? `${Math.round(values.exerciseMinutes)} min` : '--');
      setText('vital-spine-pain', values.spineDiscomfort !== undefined ? `${values.spineDiscomfort} / 10` : '--');
    } else if (regionId === 'muscles') {
      setText('vital-muscles-exercise', values.exerciseMinutes !== undefined ? `${Math.round(values.exerciseMinutes)} min` : '--');
      setText('vital-muscles-weakness', values.muscleWeakness !== undefined ? `${values.muscleWeakness} / 10` : '--');
    } else if (regionId === 'immune') {
      setText('vital-immune-temp', values.bodyTemp !== undefined ? `${Number(values.bodyTemp).toFixed(1)} °C` : '--');
      setText('vital-immune-skin', values.skinIntegrity !== undefined ? `${values.skinIntegrity} / 10` : '--');
    }
  }

  function renderSVGRegions() {
    Object.keys(window.BODY_REGIONS).forEach(rId => {
      const svgEl = document.getElementById(`region-${rId}`);
      const pinBadge = document.getElementById(`pin-badge-${rId}`);
      const statusInfo = getRegionStatus(rId);

      if (svgEl) {
        svgEl.classList.remove('status-nodata', 'status-normal', 'status-caution', 'status-critical');
        svgEl.classList.add(`status-${statusInfo.status}`);
      }

      if (pinBadge) {
        if (statusInfo.status === 'nodata') {
          pinBadge.style.fill = 'var(--status-gray)';
          pinBadge.style.filter = 'none';
        } else if (statusInfo.status === 'normal') {
          pinBadge.style.fill = 'var(--status-green)';
          pinBadge.style.filter = 'drop-shadow(0 0 6px var(--status-green))';
        } else if (statusInfo.status === 'caution') {
          pinBadge.style.fill = 'var(--status-yellow)';
          pinBadge.style.filter = 'drop-shadow(0 0 8px var(--status-yellow))';
        } else {
          pinBadge.style.fill = 'var(--status-red)';
          pinBadge.style.filter = 'drop-shadow(0 0 10px var(--status-red))';
        }
      }
    });
  }

  function renderCheckinBanner() {
    const banner = document.getElementById('checkin-banner');
    const titleEl = document.getElementById('banner-title');
    const msgEl = document.getElementById('banner-message');
    const chipsContainer = document.getElementById('banner-unlogged-chips');

    if (!banner || !chipsContainer) return;
    chipsContainer.innerHTML = '';

    const allRegions = Object.keys(window.BODY_REGIONS);
    const now = Date.now();
    const ONE_DAY = 24 * 3600 * 1000;

    // Check regions with NO reading in the last 24 hours
    const overdue = allRegions.filter(rId => {
      const latest = getLatestRegionReading(rId);
      if (!latest) return true;
      return (now - latest.timestamp) > ONE_DAY;
    });

    if (state.readings.length === 0) {
      banner.className = 'checkin-banner';
      if (titleEl) titleEl.textContent = 'Crew Health Survey';
      if (msgEl) msgEl.textContent = 'No health readings recorded yet. Tap any body part to begin your initial baseline measurement.';
      return;
    }

    if (overdue.length === 0) {
      banner.className = 'checkin-banner all-complete';
      if (titleEl) titleEl.textContent = 'Daily Check-in Complete';
      if (msgEl) msgEl.textContent = 'All 8 body systems checked within the last 24 hours. Telemetry up to date.';
    } else {
      banner.className = 'checkin-banner has-overdue';
      if (titleEl) titleEl.textContent = 'Daily Check-in Reminder';
      if (msgEl) msgEl.textContent = `${overdue.length} system${overdue.length > 1 ? 's' : ''} not measured in the last 24 hours:`;

      overdue.forEach(uId => {
        const reg = window.BODY_REGIONS[uId];
        const btn = document.createElement('button');
        btn.className = 'unlogged-chip';
        btn.innerHTML = `<span>⚡ Log ${reg.name.split(' ')[0]}</span>`;
        btn.onclick = () => openSidePanel(uId, 'tab-measure');
        chipsContainer.appendChild(btn);
      });
    }
  }

  function renderGamificationHUD() {
    setText('streak-counter', `${state.streak} Days`);
    setText('xp-counter', `${state.xp.toLocaleString()} XP`);
    setText('unlocked-badge-count', state.unlockedBadges.length);

    let rank = 'ASC';
    if (state.xp >= 3000) rank = 'FLIGHT DIR';
    else if (state.xp >= 2000) rank = 'CDR';
    else if (state.xp >= 1000) rank = 'PLT';
    else if (state.xp >= 400) rank = 'MS-1';
    setText('crew-rank', `RANK: ${rank}`);
  }

  /* ==========================================================================
     4. ANATOMICAL VIEWER CONTROLS (Layers, Zoom)
     ========================================================================== */
  function switchAnatomicalLayer(layerName) {
    state.currentLayer = layerName;

    document.querySelectorAll('.layer-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layer === layerName);
    });

    const skinLayer = document.getElementById('layer-skin');
    const muscleLayer = document.getElementById('layer-muscle');
    const skeletonLayer = document.getElementById('layer-skeleton');
    const organLayer = document.getElementById('layer-organs');

    if (layerName === 'all') {
      [skinLayer, muscleLayer, skeletonLayer, organLayer].forEach(l => l && l.classList.remove('layer-hidden'));
    } else {
      if (skinLayer) skinLayer.classList.toggle('layer-hidden', layerName !== 'skin');
      if (muscleLayer) muscleLayer.classList.toggle('layer-hidden', layerName !== 'muscle');
      if (skeletonLayer) skeletonLayer.classList.toggle('layer-hidden', layerName !== 'skeleton');
      if (organLayer) organLayer.classList.toggle('layer-hidden', layerName !== 'organs');
    }
  }

  function zoomToRegion(regionId) {
    const wrapper = document.getElementById('svg-viewport-wrapper');
    if (!wrapper) return;

    // Reset existing zooms
    resetAnatomicalZoom();

    if (regionId) {
      wrapper.classList.add(`zoomed-${regionId}`);
    }
  }

  function resetAnatomicalZoom() {
    const wrapper = document.getElementById('svg-viewport-wrapper');
    if (!wrapper) return;

    const zoomClasses = [
      'zoomed-brain', 'zoomed-eyes', 'zoomed-heart', 'zoomed-lungs',
      'zoomed-gut', 'zoomed-spine', 'zoomed-muscles', 'zoomed-immune'
    ];
    zoomClasses.forEach(c => wrapper.classList.remove(c));
  }

  /* ==========================================================================
     5. SIDE PANEL DRAWER & TABS
     ========================================================================== */
  function openSidePanel(regionId, initialTab = 'tab-vitals') {
    const reg = window.BODY_REGIONS[regionId];
    if (!reg) return;

    state.selectedRegion = regionId;
    state.selectedMetricKey = reg.primaryIndicators[0];

    // Smooth Zoom
    zoomToRegion(regionId);

    // Highlight summary card & active SVG
    document.querySelectorAll('.system-summary-card').forEach(c => {
      c.classList.toggle('active-selected', c.dataset.region === regionId);
    });

    // Populate drawer header
    setText('drawer-title', reg.name);
    setText('drawer-subtitle', reg.subtitle);
    const iconMap = {
      brain: '🧠', eyes: '👁️', heart: '🫀', lungs: '🫁',
      gut: '🥗', spine: '🦴', muscles: '🦵', immune: '🛡️'
    };
    setText('drawer-icon', iconMap[regionId] || '🩺');

    const statusInfo = getRegionStatus(regionId);
    const badge = document.getElementById('drawer-status-badge');
    if (badge) {
      badge.textContent = statusInfo.status === 'nodata' ? 'NO DATA' : statusInfo.status.toUpperCase();
      badge.className = `drawer-status-pill ${statusInfo.status}`;
    }

    // Render Tab contents
    renderVitalsTab(regionId);
    renderMeasurementTab(regionId);
    renderHistoryTab(regionId);
    renderHazardsTab(regionId);

    // Switch to initial tab
    switchDrawerTab(initialTab);

    // Open drawer
    const drawer = document.getElementById('side-panel-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
    }
    if (backdrop) backdrop.classList.add('open');
  }

  function closeSidePanel() {
    state.selectedRegion = null;
    resetAnatomicalZoom();

    const drawer = document.getElementById('side-panel-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    }
    if (backdrop) backdrop.classList.remove('open');

    document.querySelectorAll('.system-summary-card').forEach(c => c.classList.remove('active-selected'));

    if (state.chartInstance) {
      state.chartInstance.destroy();
      state.chartInstance = null;
    }
  }

  function switchDrawerTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      const isActive = b.dataset.tab === tabId;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.drawer-tab-content').forEach(c => {
      c.classList.toggle('active', c.id === tabId);
    });

    if (tabId === 'tab-history' && state.chartInstance) {
      setTimeout(() => state.chartInstance.resize(), 60);
    }
  }

  /* --------------------------------------------------------------------------
     TAB 1: VITALS, CURRENT STATUS & COMPARATIVE DELTA
     -------------------------------------------------------------------------- */
  function renderVitalsTab(regionId) {
    const reg = window.BODY_REGIONS[regionId];
    if (!reg) return;

    // What this body part does & why spaceflight affects it
    setText('drawer-function-text', reg.simpleDescription);

    const latest = getLatestRegionReading(regionId);
    const previous = getPreviousRegionReading(regionId);
    const statusInfo = getRegionStatus(regionId);

    const card = document.getElementById('drawer-status-result-card');
    if (card) {
      card.className = `drawer-card status-result-card ${statusInfo.status}`;
    }

    const grade = document.getElementById('drawer-clinical-grade');
    if (grade) {
      grade.textContent = statusInfo.status === 'nodata' ? 'NO READINGS LOGGED' : statusInfo.status.toUpperCase();
      grade.style.color = statusInfo.status === 'nodata'
        ? 'var(--status-gray)'
        : statusInfo.status === 'normal'
        ? 'var(--status-green)'
        : statusInfo.status === 'caution'
        ? 'var(--status-yellow)'
        : 'var(--status-red)';
    }

    // Display primary metric value
    const metricDisplay = document.getElementById('drawer-status-metric-display');
    const currentMetricKey = state.selectedMetricKey || reg.primaryIndicators[0];
    const ref = window.REFERENCE_RANGES[currentMetricKey];

    if (metricDisplay && ref) {
      if (latest && latest.values[currentMetricKey] !== undefined) {
        const val = latest.values[currentMetricKey];
        const dateStr = new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        metricDisplay.innerHTML = `
          <span class="big-value">${ref.format(val)}</span>
          <span class="metric-label">${ref.name} (Logged at ${dateStr})</span>
        `;
      } else {
        metricDisplay.innerHTML = `
          <span class="big-value" style="color:var(--text-muted)">--</span>
          <span class="metric-label">${ref.name} (No data yet)</span>
        `;
      }
    }

    // Comparison Delta vs Previous Reading
    const deltaBox = document.getElementById('drawer-delta-comparison');
    if (deltaBox) {
      if (!latest) {
        deltaBox.innerHTML = `<span>⚪</span> <span>No readings recorded yet. Tap "Log Measurement" to enter your first data point.</span>`;
      } else if (!previous) {
        deltaBox.innerHTML = `<span>📌</span> <span><strong>Baseline Entry:</strong> First measurement recorded for this body system.</span>`;
      } else {
        const currVal = latest.values[currentMetricKey];
        const prevVal = previous.values[currentMetricKey];
        if (currVal !== undefined && prevVal !== undefined) {
          const diff = currVal - prevVal;
          const diffFormatted = Math.abs(diff) < 0.1 ? 'steady' : diff > 0 ? `+${diff.toFixed(1)} ${ref.unit}` : `${diff.toFixed(1)} ${ref.unit}`;
          const icon = Math.abs(diff) < 0.1 ? '➡️' : diff > 0 ? '🔺' : '🔻';
          deltaBox.innerHTML = `<span>${icon}</span> <span><strong>Trend:</strong> ${ref.name} is <strong>${diffFormatted}</strong> compared to previous log.</span>`;
        } else {
          deltaBox.innerHTML = `<span>📌</span> <span>Reading updated. Continued routine monitoring active.</span>`;
        }
      }
    }

    // Reference Range Box
    const refBox = document.getElementById('drawer-reference-range-box');
    if (refBox && ref) {
      refBox.innerHTML = `
        <div><strong>Nominal Target:</strong> <span class="range-val">${ref.normalMin} - ${ref.normalMax} ${ref.unit}</span></div>
        <div><strong>Typical Range:</strong> ${ref.typicalText}</div>
        <div class="source-citation"><strong>Source Citation:</strong> ${ref.source}</div>
      `;
    }

    // Critical Alert Banner
    const critAlert = document.getElementById('drawer-critical-alert');
    if (critAlert) {
      if (statusInfo.status === 'critical') {
        critAlert.style.display = 'flex';
        setText('drawer-critical-text', `Critical reading detected in ${reg.name}. Alert Ground Flight Surgeon or initiate onboard clinical countermeasure protocols.`);
      } else {
        critAlert.style.display = 'none';
      }
    }

    // Countermeasures checklist
    const actionsList = document.getElementById('drawer-actions-list');
    if (actionsList) {
      actionsList.innerHTML = reg.countermeasures.map(item => `
        <li class="countermeasure-item">
          <span class="item-check-icon">✓</span>
          <span>${item}</span>
        </li>
      `).join('');
    }

    // Escalation Guidance
    renderEscalationTab(regionId);
  }

  function renderEscalationTab(regionId) {
    const reg = window.BODY_REGIONS[regionId];
    const env = window.MISSION_ENVIRONMENTS[state.currentEnv];
    if (!reg || !env) return;

    const commNotice = document.getElementById('drawer-escalation-comm-notice');
    if (commNotice) {
      commNotice.innerHTML = `
        <strong>Comm Latency:</strong> Mission control delay is <strong>${env.commDelay}</strong>.
      `;
    }

    const guidance = document.getElementById('drawer-escalation-guidance');
    if (guidance) {
      guidance.innerHTML = `
        <p>${reg.escalationGuidance}</p>
        <div style="margin-top:8px; font-size:0.72rem; color:var(--text-secondary);">
          <strong>Autonomous Medical Rule:</strong> In deep space communications blackouts or Mars latency (>5 min), the onboard Crew Medical Officer (CMO) holds operational triage authority.
        </div>
      `;
    }
  }

  /* --------------------------------------------------------------------------
     TAB 2: TAKE MEASUREMENT FORM (Optional Fields + Validation)
     -------------------------------------------------------------------------- */
  function renderMeasurementTab(regionId) {
    const reg = window.BODY_REGIONS[regionId];
    if (!reg) return;

    // Measurement guide steps
    const guideList = document.getElementById('drawer-measurement-guide');
    if (guideList) {
      guideList.innerHTML = reg.measurementGuide.map(step => `<li>${step}</li>`).join('');
    }

    // Form inputs grid
    const container = document.getElementById('drawer-form-inputs');
    const errBanner = document.getElementById('form-error-banner');
    if (errBanner) errBanner.style.display = 'none';

    if (!container) return;
    container.innerHTML = '';

    const allIndicators = [...reg.primaryIndicators, ...(reg.secondaryIndicators || [])];

    allIndicators.forEach(indKey => {
      const ref = window.REFERENCE_RANGES[indKey];
      if (!ref) return;

      const group = document.createElement('div');
      group.className = 'input-group';

      if (indKey === 'headachePresent') {
        // Dropdown for boolean indicator
        group.innerHTML = `
          <div class="input-label-row">
            <label class="input-label" for="input-${indKey}">${ref.name}</label>
            <span class="input-unit">status</span>
          </div>
          <select id="input-${indKey}" name="${indKey}" class="telemetry-select">
            <option value="">-- Leave blank / unmeasured --</option>
            <option value="0">None / Clear (0)</option>
            <option value="1">Present / Sinus Pressure (1)</option>
          </select>
          <div class="input-typical-tag">Typical: None in nominal atmospheric pCO2</div>
        `;
      } else {
        // Numeric input with step and placeholder
        const stepVal = (ref.unit === '°C' || ref.unit === 'hours' || ref.unit === 'Liters') ? '0.1' : '1';
        group.innerHTML = `
          <div class="input-label-row">
            <label class="input-label" for="input-${indKey}">${ref.name}</label>
            <span class="input-unit">${ref.unit}</span>
          </div>
          <input 
            type="number" 
            step="${stepVal}" 
            id="input-${indKey}" 
            name="${indKey}"
            class="telemetry-input" 
            placeholder="Optional"
          >
          <div class="input-typical-tag">Typical: ${ref.typicalText}</div>
        `;
      }

      container.appendChild(group);
    });
  }

  function handleMeasurementSubmit(event) {
    event.preventDefault();
    if (!state.selectedRegion) return;

    const reg = window.BODY_REGIONS[state.selectedRegion];
    if (!reg) return;

    const errBanner = document.getElementById('form-error-banner');
    if (errBanner) errBanner.style.display = 'none';

    const allIndicators = [...reg.primaryIndicators, ...(reg.secondaryIndicators || [])];
    const newValues = {};
    let atLeastOneProvided = false;
    let validationError = null;

    for (const indKey of allIndicators) {
      const input = document.getElementById(`input-${indKey}`);
      if (!input) continue;

      const rawVal = input.value.trim();
      const valResult = window.validateMetricInput(indKey, rawVal);

      if (!valResult.valid) {
        validationError = valResult.error;
        break;
      }

      if (!valResult.empty) {
        newValues[indKey] = valResult.value;
        atLeastOneProvided = true;
      }
    }

    if (validationError) {
      if (errBanner) {
        errBanner.textContent = `⚠️ Validation: ${validationError}`;
        errBanner.style.display = 'block';
      }
      return;
    }

    if (!atLeastOneProvided) {
      if (errBanner) {
        errBanner.textContent = '⚠️ Please enter at least one measurement before submitting.';
        errBanner.style.display = 'block';
      }
      return;
    }

    // Determine status of this new reading
    let worstSt = 'normal';
    Object.keys(newValues).forEach(k => {
      const st = evaluateMetricStatus(k, newValues[k]);
      if (st === 'critical') worstSt = 'critical';
      else if (st === 'caution' && worstSt !== 'critical') worstSt = 'caution';
    });

    // Create timestamped reading record
    const newRecord = {
      id: `reading_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      regionId: state.selectedRegion,
      values: newValues,
      status: worstSt,
      env: state.currentEnv
    };

    state.readings.push(newRecord);

    // Gamification
    state.xp += 50;
    if (state.streak === 0) state.streak = 1;

    // Check Badges
    checkBadges();

    // Persist & Refresh UI
    saveCurrentData();
    refreshAllUI();

    showToast(`Logged ${reg.name} measurement! (+50 XP)`);

    // Refresh drawer and switch to Vitals diagnosis
    renderVitalsTab(state.selectedRegion);
    renderHistoryTab(state.selectedRegion);
    switchDrawerTab('tab-vitals');
  }

  /* --------------------------------------------------------------------------
     TAB 3: HISTORY LOG (Chart.js & Data Table with Delete)
     -------------------------------------------------------------------------- */
  function renderHistoryTab(regionId) {
    const reg = window.BODY_REGIONS[regionId];
    if (!reg) return;

    const readings = getRegionReadings(regionId);
    const emptyState = document.getElementById('chart-empty-state');
    const tableBody = document.getElementById('drawer-history-tbody');
    const picker = document.getElementById('chart-metric-picker');

    // Chart Metric Picker
    if (picker) {
      picker.innerHTML = '';
      const allIndicators = [...reg.primaryIndicators, ...(reg.secondaryIndicators || [])];
      if (allIndicators.length > 1) {
        allIndicators.forEach(indKey => {
          const ref = window.REFERENCE_RANGES[indKey];
          if (!ref) return;
          const btn = document.createElement('button');
          btn.className = `picker-btn ${state.selectedMetricKey === indKey ? 'active' : ''}`;
          btn.textContent = ref.name.split(' ')[0];
          btn.onclick = () => {
            state.selectedMetricKey = indKey;
            renderHistoryTab(regionId);
          };
          picker.appendChild(btn);
        });
      }
    }

    const currentMetricKey = state.selectedMetricKey || reg.primaryIndicators[0];
    const ref = window.REFERENCE_RANGES[currentMetricKey];

    // Render Table Rows
    if (tableBody) {
      if (readings.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:16px;">No measurements logged yet for this region.</td></tr>`;
      } else {
        tableBody.innerHTML = readings.map(r => {
          const d = new Date(r.timestamp);
          const timeStr = `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          const valSummary = Object.keys(r.values).map(k => {
            const rRef = window.REFERENCE_RANGES[k];
            return rRef ? `${rRef.name.split(' ')[0]}: ${rRef.format(r.values[k])}` : '';
          }).join(', ');

          return `
            <tr>
              <td>${timeStr}</td>
              <td>${valSummary}</td>
              <td><span class="card-status-pill ${r.status}">${r.status.toUpperCase()}</span></td>
              <td>
                <button class="btn-delete-row" title="Delete this measurement" onclick="window.crewAppDeleteReading('${r.id}')">
                  🗑️
                </button>
              </td>
            </tr>
          `;
        }).reverse().join('');
      }
    }

    // Render Chart
    const canvas = document.getElementById('region-trend-chart');
    if (!canvas) return;

    // Filter readings that actually have this metric recorded
    const validMetricReadings = readings.filter(r => r.values && r.values[currentMetricKey] !== undefined);

    if (validMetricReadings.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (state.chartInstance) {
        state.chartInstance.destroy();
        state.chartInstance = null;
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    setText('drawer-chart-metric-title', `${ref.name} (${ref.unit})`);

    const labels = validMetricReadings.map(r => {
      const d = new Date(r.timestamp);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    });

    const dataVals = validMetricReadings.map(r => r.values[currentMetricKey]);
    const normalMinVals = validMetricReadings.map(() => ref.normalMin);
    const normalMaxVals = validMetricReadings.map(() => ref.normalMax);

    if (state.chartInstance) {
      state.chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    state.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Normal Max',
            data: normalMaxVals,
            borderColor: 'rgba(16, 185, 129, 0.3)',
            borderDash: [3, 4],
            borderWidth: 1,
            pointRadius: 0,
            fill: '+1',
            backgroundColor: 'rgba(16, 185, 129, 0.12)'
          },
          {
            label: 'Normal Min',
            data: normalMinVals,
            borderColor: 'rgba(16, 185, 129, 0.3)',
            borderDash: [3, 4],
            borderWidth: 1,
            pointRadius: 0,
            fill: false
          },
          {
            label: ref.name,
            data: dataVals,
            borderColor: '#00f0ff',
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 4,
            pointBackgroundColor: '#00f0ff',
            pointBorderColor: '#050811',
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(14, 23, 42, 0.95)',
            titleColor: '#00f0ff',
            bodyColor: '#f0f6fc',
            borderColor: '#22375d',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#9db2cc', font: { size: 9, family: 'monospace' } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#9db2cc', font: { size: 9, family: 'monospace' } }
          }
        }
      }
    });
  }

  function deleteReading(readingId) {
    const idx = state.readings.findIndex(r => r.id === readingId);
    if (idx !== -1) {
      state.readings.splice(idx, 1);
      saveCurrentData();
      refreshAllUI();
      if (state.selectedRegion) {
        renderVitalsTab(state.selectedRegion);
        renderHistoryTab(state.selectedRegion);
      }
      showToast('Measurement removed from mission log.');
    }
  }

  // Expose delete to window for table onclick
  window.crewAppDeleteReading = deleteReading;

  /* --------------------------------------------------------------------------
     TAB 4: NASA 5 HAZARDS
     -------------------------------------------------------------------------- */
  function renderHazardsTab(regionId) {
    const reg = window.BODY_REGIONS[regionId];
    const env = window.MISSION_ENVIRONMENTS[state.currentEnv];
    if (!reg || !env) return;

    const envCallout = document.getElementById('drawer-env-emphasis');
    if (envCallout) {
      envCallout.innerHTML = `
        <strong>Active Mission: ${env.name}</strong><br>
        <em>${env.emphasis}</em>
      `;
    }

    const hazardList = document.getElementById('drawer-hazard-list');
    if (hazardList) {
      hazardList.innerHTML = reg.hazardDetails.map(hItem => {
        const meta = window.NASA_HAZARDS[hItem.hazard];
        const isEmphasized = env.primaryHazards.includes(hItem.hazard);
        return `
          <div class="hazard-detail-card" style="${isEmphasized ? 'border-color: var(--cyan-bright); background: rgba(0, 240, 255, 0.06);' : ''}">
            <div class="hazard-card-head">
              <span class="hazard-card-icon">${meta ? meta.icon : '⚠️'}</span>
              <span class="hazard-card-title">${meta ? meta.name : 'Space Hazard'}</span>
              <span class="hazard-card-code">HAZARD ${hItem.hazard}</span>
              ${isEmphasized ? '<span style="font-size:0.65rem; color:var(--cyan-bright); font-weight:800; margin-left:auto;">PRIMARY RISK</span>' : ''}
            </div>
            <p class="hazard-desc">${hItem.text}</p>
          </div>
        `;
      }).join('');
    }
  }

  /* ==========================================================================
     6. MISSION ENVIRONMENT SWITCHER
     ========================================================================== */
  function updateMissionEnvironment(envKey) {
    const env = window.MISSION_ENVIRONMENTS[envKey];
    if (!env) return;
    state.currentEnv = envKey;

    document.querySelectorAll('.env-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.env === envKey);
    });

    setText('env-gravity-val', env.gravity);
    setText('env-comm-val', env.commDelay);
    setText('env-hazard-val', env.emphasis.split('.')[0]);

    if (state.selectedRegion) {
      renderHazardsTab(state.selectedRegion);
      renderEscalationTab(state.selectedRegion);
    }

    saveCurrentData();
  }

  /* ==========================================================================
     7. EXPORT, CLEAR & DEMO DATA MANAGEMENT
     ========================================================================== */
  function exportDataJSON() {
    const exportPayload = {
      application: 'Crew Health Companion',
      version: '3.0.0',
      exportTimestamp: new Date().toISOString(),
      astronautStats: {
        streak: state.streak,
        xp: state.xp,
        unlockedBadges: state.unlockedBadges
      },
      missionEnvironment: state.currentEnv,
      readingsCount: state.readings.length,
      readings: state.readings
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crew_health_telemetry_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Exported health telemetry to JSON file.');
  }

  function clearAllData() {
    const confirmed = window.confirm(
      'Are you sure you want to permanently clear all health measurements?\n\nThis will reset the application to its initial blank state.'
    );

    if (confirmed) {
      state.readings = [];
      state.streak = 0;
      state.xp = 0;
      state.unlockedBadges = [];
      saveCurrentData();
      closeSidePanel();
      refreshAllUI();
      showToast('All health telemetry cleared. Initial blank state restored.');
    }
  }

  function loadDemoData() {
    state.readings = window.generatePreloadedHistory();
    state.streak = 14;
    state.xp = 1650;
    state.unlockedBadges = ['first_log', 'heart_hero', 'sleep_champion', 'gravity_defier'];
    saveCurrentData();
    refreshAllUI();
    if (state.selectedRegion) {
      renderVitalsTab(state.selectedRegion);
      renderHistoryTab(state.selectedRegion);
    }
    showToast('Demo dataset loaded for presentation mode.');
  }

  /* ==========================================================================
     8. GAMIFICATION & BADGES
     ========================================================================== */
  function checkBadges() {
    const newlyUnlocked = [];

    // 'first_log'
    if (!state.unlockedBadges.includes('first_log') && state.readings.length >= 1) {
      newlyUnlocked.push('first_log');
    }

    // 'deep_space_pioneer': All 8 regions logged
    if (!state.unlockedBadges.includes('deep_space_pioneer')) {
      const allRegions = Object.keys(window.BODY_REGIONS);
      const allLogged = allRegions.every(rId => getLatestRegionReading(rId) !== null);
      if (allLogged) newlyUnlocked.push('deep_space_pioneer');
    }

    // 'heart_hero': 5 heart measurements logged
    if (!state.unlockedBadges.includes('heart_hero')) {
      const heartLogs = getRegionReadings('heart');
      if (heartLogs.length >= 5) newlyUnlocked.push('heart_hero');
    }

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(bId => {
        state.unlockedBadges.push(bId);
        const bMeta = window.BADGES.find(b => b.id === bId);
        if (bMeta) {
          state.xp += bMeta.xpReward;
          showToast(`🏅 Badge Unlocked: "${bMeta.title}"! (+${bMeta.xpReward} XP)`);
        }
      });
      renderGamificationHUD();
    }
  }

  function openBadgesModal() {
    const overlay = document.getElementById('badges-modal-overlay');
    const grid = document.getElementById('badges-modal-grid');
    if (!overlay || !grid) return;

    grid.innerHTML = window.BADGES.map(b => {
      const isUnlocked = state.unlockedBadges.includes(b.id);
      return `
        <div class="badge-item ${isUnlocked ? 'unlocked' : ''}">
          <div class="badge-item-icon">${b.icon}</div>
          <div class="badge-item-info">
            <h4>${b.title} ${isUnlocked ? '✓' : '🔒'}</h4>
            <p>${b.description}</p>
            <span class="badge-reward-tag">${isUnlocked ? 'UNLOCKED' : `+${b.xpReward} XP`}</span>
          </div>
        </div>
      `;
    }).join('');

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeBadgesModal() {
    const overlay = document.getElementById('badges-modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  /* ==========================================================================
     9. STARFIELD & MET CLOCK
     ========================================================================== */
  function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scene = document.getElementById('space-background');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let meteor = null;
    let nextMeteorAt = 0;
    let stars = [];
    const colors = ['190, 220, 255', '133, 191, 255', '238, 217, 255'];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const compact = width < 700;
      const counts = compact ? [75, 48, 22] : [120, 76, 34];
      stars = [];
      counts.forEach((count, layer) => {
        for (let i = 0; i < count; i += 1) {
          stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: layer === 0 ? Math.random() * .45 + .25 : layer === 1 ? Math.random() * .75 + .45 : Math.random() * 1.25 + .7,
            alpha: Math.random() * .5 + .35,
            phase: Math.random() * Math.PI * 2,
            speed: (Math.random() * .45 + .2) * (layer + 1),
            layer,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
      });
      draw(performance.now(), true);
    }

    function draw(now, staticFrame = false) {
      ctx.clearRect(0, 0, width, height);
      const drift = staticFrame || reducedMotion.matches ? 0 : (now / 60000) * 3;
      stars.forEach(star => {
        const twinkle = reducedMotion.matches ? 1 : .62 + .38 * Math.sin(star.phase + now * .001 * star.speed);
        const layerOffset = drift * (star.layer + 1) * .28;
        const x = (star.x + layerOffset) % (width || 1);
        ctx.beginPath();
        ctx.arc(x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.color}, ${star.alpha * twinkle})`;
        ctx.shadowBlur = star.layer === 2 ? 7 : 0;
        ctx.shadowColor = `rgba(${star.color}, .75)`;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      if (!reducedMotion.matches && !staticFrame) {
        if (!meteor && now >= nextMeteorAt) {
          meteor = { x: Math.random() * width * .82, y: Math.random() * height * .3, start: now, duration: 1250 };
          nextMeteorAt = now + 10000 + Math.random() * 5000;
        }
        if (meteor) {
          const progress = (now - meteor.start) / meteor.duration;
          if (progress >= 1) meteor = null;
          else {
            const x = meteor.x + progress * 250;
            const y = meteor.y + progress * 155;
            const fade = Math.sin(progress * Math.PI);
            const trail = ctx.createLinearGradient(x - 100, y - 62, x, y);
            trail.addColorStop(0, 'rgba(125, 202, 255, 0)');
            trail.addColorStop(1, `rgba(206, 239, 255, ${fade * .88})`);
            ctx.strokeStyle = trail;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(x - 100, y - 62);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        }
      }
    }

    function animate(now) {
      if (document.hidden) return;
      draw(now);
      frame = window.requestAnimationFrame(animate);
    }

    function stop() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      if (scene) scene.classList.add('background-paused');
    }

    function start() {
      if (document.hidden) return;
      if (scene) scene.classList.remove('background-paused');
      if (frame) window.cancelAnimationFrame(frame);
      if (reducedMotion.matches) {
        draw(performance.now(), true);
        frame = 0;
      } else {
        if (!nextMeteorAt) nextMeteorAt = performance.now() + 10000 + Math.random() * 5000;
        frame = window.requestAnimationFrame(animate);
      }
    }

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', start);
    resize();
    start();
  }

  function initMETClock() {
    const clockEl = document.getElementById('met-clock');
    if (!clockEl) return;

    let seconds = 22;
    let minutes = 14;
    let hours = 8;
    let days = 1;

    setInterval(() => {
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
          minutes = 0;
          hours++;
          if (hours >= 24) {
            hours = 0;
            days++;
          }
        }
      }
      const sDay = String(days).padStart(3, '0');
      const sH = String(hours).padStart(2, '0');
      const sM = String(minutes).padStart(2, '0');
      const sS = String(seconds).padStart(2, '0');
      clockEl.textContent = `${sDay}:${sH}:${sM}:${sS}`;
    }, 1000);
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>🛰️</span> <span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3400);
  }

  /* ==========================================================================
     10. EVENT LISTENERS & TOOLTIP CONTROLS
     ========================================================================== */
  function showBodyTooltip(regionId, event) {
    const tooltip = document.getElementById('body-tooltip');
    const wrapper = document.getElementById('svg-viewport-wrapper');
    const reg = window.BODY_REGIONS[regionId];
    if (!tooltip || !wrapper || !reg) return;

    const statusInfo = getRegionStatus(regionId);
    const statusLabel = statusInfo.status === 'nodata' ? 'No Data' : statusInfo.status.toUpperCase();

    tooltip.innerHTML = `<span>${reg.name}</span><span class="tt-status ${statusInfo.status}">${statusLabel}</span>`;

    const rect = wrapper.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.classList.add('visible');
  }

  function hideBodyTooltip() {
    const tooltip = document.getElementById('body-tooltip');
    if (tooltip) tooltip.classList.remove('visible');
  }

  function setupEventListeners() {
    // 1. Interactive SVG Body Regions (Unblocked, direct clickable targets)
    document.querySelectorAll('.interactive-region').forEach(el => {
      const regionId = el.dataset.region;
      if (!regionId) return;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openSidePanel(regionId);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSidePanel(regionId);
        }
      });
      el.addEventListener('mouseenter', (e) => {
        highlightRegionCard(regionId, true);
        showBodyTooltip(regionId, e);
      });
      el.addEventListener('mousemove', (e) => {
        showBodyTooltip(regionId, e);
      });
      el.addEventListener('mouseleave', () => {
        highlightRegionCard(regionId, false);
        hideBodyTooltip();
      });
    });

    // 2. SVG Callout Pins
    document.querySelectorAll('.pin-group').forEach(pin => {
      const regionId = pin.dataset.pin;
      if (!regionId) return;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        openSidePanel(regionId);
      });
      pin.addEventListener('mouseenter', (e) => {
        highlightRegionSVG(regionId, true);
        highlightRegionCard(regionId, true);
        showBodyTooltip(regionId, e);
      });
      pin.addEventListener('mousemove', (e) => {
        showBodyTooltip(regionId, e);
      });
      pin.addEventListener('mouseleave', () => {
        highlightRegionSVG(regionId, false);
        highlightRegionCard(regionId, false);
        hideBodyTooltip();
      });
    });

    // 3. System Summary Cards
    document.querySelectorAll('.system-summary-card').forEach(card => {
      const regionId = card.dataset.region;
      card.addEventListener('click', () => openSidePanel(regionId));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSidePanel(regionId);
        }
      });
      card.addEventListener('mouseenter', () => highlightRegionSVG(regionId, true));
      card.addEventListener('mouseleave', () => highlightRegionSVG(regionId, false));
    });

    // 4. Layer Switcher Buttons
    document.querySelectorAll('.layer-pill').forEach(btn => {
      btn.addEventListener('click', () => switchAnatomicalLayer(btn.dataset.layer));
    });

    // 5. Reset Zoom Button
    const resetZoomBtn = document.getElementById('btn-reset-zoom');
    if (resetZoomBtn) resetZoomBtn.addEventListener('click', resetAnatomicalZoom);

    // 6. Drawer Close & Backdrop
    const closeBtn = document.getElementById('drawer-close-btn');
    const backdrop = document.getElementById('drawer-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeSidePanel);
    if (backdrop) backdrop.addEventListener('click', closeSidePanel);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSidePanel();
        closeBadgesModal();
      }
    });

    // 7. Drawer Tab Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchDrawerTab(btn.dataset.tab));
    });

    // 8. Measurement Form Submit
    const form = document.getElementById('measurement-form');
    if (form) form.addEventListener('submit', handleMeasurementSubmit);

    // 9. Mission Environment Buttons
    document.querySelectorAll('.env-btn').forEach(btn => {
      btn.addEventListener('click', () => updateMissionEnvironment(btn.dataset.env));
    });

    // 10. Data Management: Export, Clear, Load Demo
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportDataJSON);

    const clearBtn = document.getElementById('clear-data-btn');
    if (clearBtn) clearBtn.addEventListener('click', clearAllData);

    const demoBtn = document.getElementById('load-demo-btn');
    if (demoBtn) demoBtn.addEventListener('click', loadDemoData);

    // 11. Badges Modal
    const badgesBtn = document.getElementById('open-badges-btn');
    const xpTrigger = document.getElementById('xp-trigger');
    const badgesClose = document.getElementById('badges-modal-close');
    const badgesOverlay = document.getElementById('badges-modal-overlay');

    if (badgesBtn) badgesBtn.addEventListener('click', openBadgesModal);
    if (xpTrigger) xpTrigger.addEventListener('click', openBadgesModal);
    if (badgesClose) badgesClose.addEventListener('click', closeBadgesModal);
    if (badgesOverlay) {
      badgesOverlay.addEventListener('click', (e) => {
        if (e.target === badgesOverlay) closeBadgesModal();
      });
    }

    // 12. Telemetry Consult Request Button
    const consultBtn = document.getElementById('btn-request-consult');
    if (consultBtn) {
      consultBtn.addEventListener('click', () => {
        const env = window.MISSION_ENVIRONMENTS[state.currentEnv];
        showToast(`Medical packet transmitted to Ground. Response latency: ~${env.commDelay}.`);
      });
    }
  }

  function highlightRegionSVG(regionId, isHighlighted) {
    const el = document.getElementById(`region-${regionId}`);
    if (el) el.classList.toggle('is-hovered', isHighlighted);
  }

  function highlightRegionCard(regionId, isHighlighted) {
    const card = document.querySelector(`.system-summary-card[data-region="${regionId}"]`);
    if (card) card.classList.toggle('active-selected', isHighlighted);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
