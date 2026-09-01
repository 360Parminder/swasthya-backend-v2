/**
 * HTML Dashboard Renderer for Swasthya Server Health & Status
 */

function renderHealthDashboard(data, activePath = "/health") {
  const isHealthy = data.status === "UP";
  const isDegraded = data.status === "DEGRADED";
  const statusColor = isHealthy ? "#10b981" : (isDegraded ? "#f59e0b" : "#ef4444");
  const statusText = isHealthy ? "All Systems Operational" : (isDegraded ? "System Degraded" : "Service Disruption");
  const statusBg = isHealthy ? "rgba(16, 185, 129, 0.12)" : (isDegraded ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)");

  const db = (data.services && data.services.database) || data.database || {};
  const dbStatus = db.status || (db.state === "connected" ? "UP" : "DOWN");
  const dbIsUp = dbStatus === "UP";
  const dbLatency = db.responseTimeMs !== null && db.responseTimeMs !== undefined ? `${db.responseTimeMs} ms` : "N/A";

  const uptime = data.uptime ? (data.uptime.formatted || `${data.uptime.seconds || 0}s`) : "N/A";
  const env = (data.service && data.service.environment) || (data.server && data.server.environment) || "development";
  const version = (data.service && data.service.version) || (data.server && data.server.version) || "1.0.0";
  const port = (data.service && data.service.port) || (data.server && data.server.port) || process.env.PORT || "5000";

  const memory = data.memory || {};
  const sysMem = memory.system || {};
  const procMem = memory.process || {};
  const system = data.system || {};
  const cpu = system.cpu || {};
  const server = data.server || {};

  const initialJsonString = JSON.stringify(data, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Swasthya Server Monitor | Health & Status</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #090d16;
      --bg-surface: #0f172a;
      --bg-card: rgba(15, 23, 42, 0.75);
      --bg-card-hover: rgba(30, 41, 59, 0.6);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(16, 185, 129, 0.3);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --primary: #10b981;
      --primary-glow: rgba(16, 185, 129, 0.25);
      --cyan: #06b6d4;
      --indigo: #6366f1;
      --amber: #f59e0b;
      --rose: #ef4444;
      --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-base);
      background-image: 
        radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.07) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(99, 102, 241, 0.05) 0px, transparent 50%);
      color: var(--text-main);
      font-family: var(--font-sans);
      min-height: 100vh;
      padding: 24px;
      line-height: 1.5;
    }

    .container {
      max-width: 1240px;
      margin: 0 auto;
    }

    /* Top Navigation Bar */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 24px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .brand-icon svg {
      width: 24px;
      height: 24px;
      stroke: #ffffff;
      fill: none;
      stroke-width: 2.2;
    }

    .brand-title h1 {
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 5px 11px;
      border-radius: 20px;
      border: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge.env-badge {
      border-color: rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
      background: rgba(99, 102, 241, 0.1);
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--primary);
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 6px 12px;
      border-radius: 20px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-family: var(--font-sans);
      font-size: 0.84rem;
      font-weight: 600;
      padding: 7px 14px;
      border-radius: 10px;
      border: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #059669, #047857);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }

    select.refresh-select {
      background: rgba(15, 23, 42, 0.8);
      color: var(--text-main);
      border: 1px solid var(--border-subtle);
      padding: 6px 12px;
      border-radius: 10px;
      font-family: var(--font-sans);
      font-size: 0.82rem;
      outline: none;
      cursor: pointer;
    }

    /* Hero Status Banner */
    .hero-banner {
      background: ${statusBg};
      border: 1px solid ${statusColor}44;
      border-radius: 16px;
      padding: 24px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 24px;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    }

    .hero-status {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .status-orb {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: ${statusColor}20;
      border: 2px solid ${statusColor};
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${statusColor};
    }

    .status-orb svg {
      width: 28px;
      height: 28px;
      stroke: currentColor;
      fill: none;
      stroke-width: 2.2;
    }

    .hero-text h2 {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: ${statusColor};
      margin-bottom: 2px;
    }

    .hero-text p {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .hero-stats-row {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .hero-stat {
      text-align: right;
    }

    .hero-stat .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
    }

    .hero-stat .val {
      font-size: 1.15rem;
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--text-main);
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      gap: 6px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 24px;
      overflow-x: auto;
    }

    .tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-family: var(--font-sans);
      font-size: 0.92rem;
      font-weight: 600;
      padding: 12px 18px;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--text-main);
    }

    .tab-btn.active {
      color: var(--primary);
    }

    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary);
      box-shadow: 0 0 10px var(--primary);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
      animation: fadeIn 0.25s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Cards Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 20px;
      backdrop-filter: blur(16px);
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }

    .card:hover {
      border-color: rgba(255, 255, 255, 0.15);
      background: var(--bg-card-hover);
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.98rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .card-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon svg {
      width: 18px;
      height: 18px;
      stroke-width: 2;
      fill: none;
    }

    .icon-green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .icon-cyan { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }
    .icon-indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .icon-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

    .status-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .pill-up {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .pill-down {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .metrics-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.86rem;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .metric-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .metric-key {
      color: var(--text-muted);
    }

    .metric-val {
      font-weight: 600;
      font-family: var(--font-mono);
      color: var(--text-main);
    }

    /* Progress Bar */
    .progress-box {
      margin-top: 14px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      margin-bottom: 6px;
      color: var(--text-muted);
    }

    .progress-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      background: linear-gradient(90deg, #10b981, #06b6d4);
      transition: width 0.4s ease;
    }

    /* Endpoints Explorer */
    .endpoint-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .endpoint-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .method-tag {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      font-weight: 700;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .endpoint-path {
      font-family: var(--font-mono);
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .endpoint-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-left: 8px;
    }

    /* JSON Box */
    .json-box {
      background: #06090e;
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 20px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: #38bdf8;
      overflow-x: auto;
      max-height: 540px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .copy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    /* Footer */
    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-dim);
      font-size: 0.82rem;
      flex-wrap: wrap;
      gap: 12px;
    }

    /* Toast Notification */
    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #10b981;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 0.86rem;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
      display: none;
      align-items: center;
      gap: 8px;
      z-index: 1000;
    }

    @media (max-width: 768px) {
      body { padding: 16px; }
      .hero-stat { text-align: left; }
      header { flex-direction: column; align-items: flex-start; }
      .header-controls { width: 100%; justify-content: space-between; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header>
      <div class="brand-section">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div class="brand-title">
          <h1>Swasthya Server Monitor</h1>
          <div class="brand-subtitle">Automated Health, Performance & Telemetry Console</div>
        </div>
      </div>

      <div class="header-controls">
        <div class="live-indicator">
          <div class="pulse-dot"></div>
          <span>LIVE</span>
        </div>
        <span class="badge env-badge">${env}</span>
        <span class="badge">v${version}</span>
        <span class="badge">Port ${port}</span>

        <select class="refresh-select" id="refreshInterval" onchange="updateRefreshInterval(this.value)">
          <option value="0">Auto-refresh: Off</option>
          <option value="3000">Refresh: 3s</option>
          <option value="5000" selected>Refresh: 5s</option>
          <option value="10000">Refresh: 10s</option>
          <option value="30000">Refresh: 30s</option>
        </select>

        <button class="btn btn-primary" onclick="refreshDashboard()" id="manualRefreshBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Refresh
        </button>

        <a class="btn" href="${activePath}?format=json" target="_blank">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Raw JSON
        </a>
      </div>
    </header>

    <!-- Status Hero Banner -->
    <div class="hero-banner" id="heroBanner">
      <div class="hero-status">
        <div class="status-orb" id="statusOrb">
          ${isHealthy 
            ? '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>'
            : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
          }
        </div>
        <div class="hero-text">
          <h2 id="heroTitle">${statusText}</h2>
          <p id="heroMsg">${data.message || 'All core services and background workers are operating normally.'}</p>
        </div>
      </div>

      <div class="hero-stats-row">
        <div class="hero-stat">
          <div class="label">MongoDB Latency</div>
          <div class="val" id="heroDbLatency" style="color: ${dbIsUp ? '#10b981' : '#ef4444'}">${dbLatency}</div>
        </div>
        <div class="hero-stat">
          <div class="label">Server Uptime</div>
          <div class="val" id="heroUptime">${uptime}</div>
        </div>
        <div class="hero-stat">
          <div class="label">Last Synced</div>
          <div class="val" id="lastUpdated">${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-nav">
      <button class="tab-btn active" onclick="switchTab('overview', this)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Overview
      </button>
      <button class="tab-btn" onclick="switchTab('details', this)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        Deep Metrics
      </button>
      <button class="tab-btn" onclick="switchTab('endpoints', this)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
        Endpoints Explorer
      </button>
      <button class="tab-btn" onclick="switchTab('rawjson', this)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        Raw JSON
      </button>
    </div>

    <!-- Tab 1: Overview -->
    <div id="tab-overview" class="tab-content active">
      <div class="grid">
        <!-- Database Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon icon-green">
                <svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              </div>
              <span>Database (MongoDB)</span>
            </div>
            <span class="status-pill ${dbIsUp ? 'pill-up' : 'pill-down'}" id="dbPill">${dbStatus}</span>
          </div>
          <ul class="metrics-list">
            <li class="metric-row">
              <span class="metric-key">Connection State</span>
              <span class="metric-val" id="dbState">${db.state || 'unknown'}</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">Ping Latency</span>
              <span class="metric-val" id="dbLatencyVal">${dbLatency}</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">Database Host</span>
              <span class="metric-val" id="dbHost">${db.host || 'localhost'}</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">Database Name</span>
              <span class="metric-val" id="dbName">${db.database || 'swasthya'}</span>
            </li>
          </ul>
        </div>

        <!-- Node.js Process Runtime Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon icon-cyan">
                <svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              </div>
              <span>Node.js Process</span>
            </div>
            <span class="status-pill pill-up">ONLINE</span>
          </div>
          <ul class="metrics-list">
            <li class="metric-row">
              <span class="metric-key">Process ID (PID)</span>
              <span class="metric-val" id="procPid">${server.pid || process.pid}</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">Node Runtime</span>
              <span class="metric-val" id="procNodeVer">${server.nodeVersion || process.version}</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">Process Uptime</span>
              <span class="metric-val" id="procUptime">${uptime}</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">Heap Used</span>
              <span class="metric-val" id="procHeapUsed">${procMem.heapUsedMB ? procMem.heapUsedMB + ' MB' : 'Active'}</span>
            </li>
          </ul>
        </div>

        <!-- System Resources Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon icon-indigo">
                <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
              </div>
              <span>System & CPU</span>
            </div>
            <span class="badge">${system.arch || 'arm64'}</span>
          </div>
          <ul class="metrics-list">
            <li class="metric-row">
              <span class="metric-key">CPU Model</span>
              <span class="metric-val" id="cpuModel" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cpu.model || 'Multi-Core'}</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">CPU Cores</span>
              <span class="metric-val" id="cpuCores">${cpu.cores || 8} Cores</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">System Platform</span>
              <span class="metric-val" id="sysPlatform">${system.platform || 'darwin'} (${system.osRelease || ''})</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">Load Avg (1m, 5m, 15m)</span>
              <span class="metric-val" id="sysLoad">${(system.loadAverage || [0,0,0]).join(', ')}</span>
            </li>
          </ul>
        </div>

        <!-- System Memory Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon icon-amber">
                <svg viewBox="0 0 24 24"><path d="M6 19v-3"/><path d="M10 19v-3"/><path d="M14 19v-3"/><path d="M18 19v-3"/><rect x="2" y="6" width="20" height="10" rx="2"/></svg>
              </div>
              <span>Memory Utilization</span>
            </div>
            <span class="metric-val" id="sysMemPct">${sysMem.usagePercentage || 'N/A'}</span>
          </div>
          <ul class="metrics-list">
            <li class="metric-row">
              <span class="metric-key">System Total RAM</span>
              <span class="metric-val" id="sysTotalMem">${sysMem.totalMB ? sysMem.totalMB + ' MB' : 'N/A'}</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">System Free RAM</span>
              <span class="metric-val" id="sysFreeMem">${sysMem.freeMB ? sysMem.freeMB + ' MB' : 'N/A'}</span>
            </li>
            <li class="metric-row">
              <span class="metric-key">Node RSS Memory</span>
              <span class="metric-val" id="procRss">${procMem.rssMB ? procMem.rssMB + ' MB' : 'N/A'}</span>
            </li>
          </ul>
          <div class="progress-box">
            <div class="progress-header">
              <span>RAM Usage</span>
              <span id="memBarPct">${sysMem.usagePercentage || '0%'}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" id="memBarFill" style="width: ${sysMem.usagePercentage || '50%'}"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Deep Metrics -->
    <div id="tab-details" class="tab-content">
      <div class="grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon icon-green"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
              <span>Process Memory Breakdown</span>
            </div>
          </div>
          <ul class="metrics-list">
            <li class="metric-row"><span class="metric-key">Resident Set Size (RSS)</span><span class="metric-val" id="deepRss">${procMem.rssMB || 'N/A'} MB</span></li>
            <li class="metric-row"><span class="metric-key">Heap Total</span><span class="metric-val" id="deepHeapTotal">${procMem.heapTotalMB || 'N/A'} MB</span></li>
            <li class="metric-row"><span class="metric-key">Heap Used</span><span class="metric-val" id="deepHeapUsed">${procMem.heapUsedMB || 'N/A'} MB</span></li>
            <li class="metric-row"><span class="metric-key">Heap Utilization</span><span class="metric-val" id="deepHeapPct">${procMem.heapUsagePercentage || 'N/A'}</span></li>
            <li class="metric-row"><span class="metric-key">External C++ Memory</span><span class="metric-val" id="deepExternal">${procMem.externalMB || 'N/A'} MB</span></li>
          </ul>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon icon-cyan"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg></div>
              <span>Server & Host Information</span>
            </div>
          </div>
          <ul class="metrics-list">
            <li class="metric-row"><span class="metric-key">Hostname</span><span class="metric-val" id="deepHostname">${system.hostname || 'localhost'}</span></li>
            <li class="metric-row"><span class="metric-key">Operating System</span><span class="metric-val" id="deepOs">${system.osType || 'Darwin'} (${system.platform || ''})</span></li>
            <li class="metric-row"><span class="metric-key">OS Release</span><span class="metric-val" id="deepOsRel">${system.osRelease || ''}</span></li>
            <li class="metric-row"><span class="metric-key">Architecture</span><span class="metric-val" id="deepArch">${system.arch || 'arm64'}</span></li>
            <li class="metric-row"><span class="metric-key">System Uptime</span><span class="metric-val" id="deepSysUptime">${(system.uptime && system.uptime.formatted) || 'N/A'}</span></li>
            <li class="metric-row"><span class="metric-key">V8 Engine Version</span><span class="metric-val" id="deepV8">${server.v8Version || 'N/A'}</span></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Tab 3: Endpoints Explorer -->
    <div id="tab-endpoints" class="tab-content">
      <div class="card" style="margin-bottom: 20px;">
        <div class="card-header">
          <div class="card-title">
            <div class="card-icon icon-green"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg></div>
            <span>Available Health & Status Endpoints</span>
          </div>
          <span class="badge">5 Live Routes</span>
        </div>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 18px;">
          Click "Test" on any endpoint to dispatch a live request and inspect response codes and payload in real-time.
        </p>

        <div class="endpoint-card">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/health</span>
            <span class="endpoint-desc">Comprehensive health overview (Database, Latency, Uptime)</span>
          </div>
          <button class="btn" onclick="testEndpoint('/health?format=json')">Test</button>
        </div>

        <div class="endpoint-card">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/status</span>
            <span class="endpoint-desc">Lightweight server ping, app name & uptime</span>
          </div>
          <button class="btn" onclick="testEndpoint('/status?format=json')">Test</button>
        </div>

        <div class="endpoint-card">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/health/details</span>
            <span class="endpoint-desc">Deep telemetry: OS metrics, memory breakdown, CPU stats</span>
          </div>
          <button class="btn" onclick="testEndpoint('/health/details?format=json')">Test</button>
        </div>

        <div class="endpoint-card">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/health/ready</span>
            <span class="endpoint-desc">Readiness probe for Kubernetes & Load Balancers (503 if DB down)</span>
          </div>
          <button class="btn" onclick="testEndpoint('/health/ready')">Test</button>
        </div>

        <div class="endpoint-card">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/health/live</span>
            <span class="endpoint-desc">Liveness probe indicating Node process is alive</span>
          </div>
          <button class="btn" onclick="testEndpoint('/health/live')">Test</button>
        </div>
      </div>

      <!-- Endpoint Response Viewer -->
      <div id="endpointResultBox" style="display: none;">
        <div class="copy-header">
          <span style="font-weight: 600; font-size: 0.9rem;" id="endpointResultTitle">Endpoint Response</span>
          <span class="badge" id="endpointResultBadge">200 OK</span>
        </div>
        <pre class="json-box" id="endpointResultJson"></pre>
      </div>
    </div>

    <!-- Tab 4: Raw JSON -->
    <div id="tab-rawjson" class="tab-content">
      <div class="copy-header">
        <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">Current Payload: ${activePath}</span>
        <button class="btn" onclick="copyRawJson()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy JSON
        </button>
      </div>
      <pre class="json-box" id="rawJsonBlock">${initialJsonString}</pre>
    </div>

    <!-- Footer -->
    <footer>
      <div>Swasthya Backend Service &bull; Server Health Monitor</div>
      <div>Designed for Cloud Deployment, Kubernetes Probes & Local Debugging</div>
    </footer>
  </div>

  <!-- Toast Notification -->
  <div id="toast">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
    <span id="toastMsg">Copied to clipboard!</span>
  </div>

  <script>
    let activeInterval = null;
    const currentPath = "${activePath}";

    function switchTab(tabId, btn) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');
    }

    async function refreshDashboard() {
      const btn = document.getElementById('manualRefreshBtn');
      if (btn) btn.style.opacity = '0.6';

      try {
        const res = await fetch('/health/details?format=json');
        const json = await res.json();
        updateDashboardView(json);
        showToast('Dashboard metrics refreshed');
      } catch (err) {
        console.error('Failed to refresh metrics:', err);
      } finally {
        if (btn) btn.style.opacity = '1';
      }
    }

    function updateDashboardView(data) {
      const db = (data.services && data.services.database) || data.database || {};
      const isUp = data.status === 'UP';
      const dbIsUp = db.status === 'UP';
      const dbLatency = db.responseTimeMs !== null && db.responseTimeMs !== undefined ? db.responseTimeMs + ' ms' : 'N/A';
      const uptime = data.uptime ? (data.uptime.formatted || data.uptime.seconds + 's') : (data.server?.uptime?.formatted || 'N/A');

      // Hero
      const heroTitle = document.getElementById('heroTitle');
      const heroMsg = document.getElementById('heroMsg');
      if (heroTitle) heroTitle.innerText = isUp ? 'All Systems Operational' : (data.status === 'DEGRADED' ? 'System Degraded' : 'Service Disruption');
      if (heroMsg) heroMsg.innerText = data.message || (isUp ? 'All core services and background workers are operating normally.' : 'Database or service degraded');

      const heroDbLatency = document.getElementById('heroDbLatency');
      if (heroDbLatency) {
        heroDbLatency.innerText = dbLatency;
        heroDbLatency.style.color = dbIsUp ? '#10b981' : '#ef4444';
      }

      const heroUptime = document.getElementById('heroUptime');
      if (heroUptime) heroUptime.innerText = uptime;

      const lastUpdated = document.getElementById('lastUpdated');
      if (lastUpdated) lastUpdated.innerText = new Date().toLocaleTimeString();

      // Database
      const dbPill = document.getElementById('dbPill');
      if (dbPill) {
        dbPill.innerText = db.status || (dbIsUp ? 'UP' : 'DOWN');
        dbPill.className = 'status-pill ' + (dbIsUp ? 'pill-up' : 'pill-down');
      }
      const dbState = document.getElementById('dbState');
      if (dbState) dbState.innerText = db.state || 'unknown';
      const dbLatencyVal = document.getElementById('dbLatencyVal');
      if (dbLatencyVal) dbLatencyVal.innerText = dbLatency;

      // Memory & CPU
      if (data.memory?.system) {
        const sys = data.memory.system;
        const sysMemPct = document.getElementById('sysMemPct');
        if (sysMemPct) sysMemPct.innerText = sys.usagePercentage || 'N/A';
        const sysFreeMem = document.getElementById('sysFreeMem');
        if (sysFreeMem) sysFreeMem.innerText = (sys.freeMB || '') + ' MB';
        const memBarPct = document.getElementById('memBarPct');
        if (memBarPct) memBarPct.innerText = sys.usagePercentage || '0%';
        const memBarFill = document.getElementById('memBarFill');
        if (memBarFill) memBarFill.style.width = sys.usagePercentage || '0%';
      }

      if (data.memory?.process) {
        const proc = data.memory.process;
        const procHeapUsed = document.getElementById('procHeapUsed');
        if (procHeapUsed) procHeapUsed.innerText = (proc.heapUsedMB || '') + ' MB';
        const procRss = document.getElementById('procRss');
        if (procRss) procRss.innerText = (proc.rssMB || '') + ' MB';
      }

      // Raw JSON
      const rawJson = document.getElementById('rawJsonBlock');
      if (rawJson) rawJson.innerText = JSON.stringify(data, null, 2);
    }

    async function testEndpoint(endpoint) {
      const resultBox = document.getElementById('endpointResultBox');
      const title = document.getElementById('endpointResultTitle');
      const badge = document.getElementById('endpointResultBadge');
      const jsonPre = document.getElementById('endpointResultJson');

      resultBox.style.display = 'block';
      title.innerText = 'Testing ' + endpoint + '...';
      badge.innerText = 'Requesting';
      badge.style.color = '#38bdf8';
      jsonPre.innerText = 'Sending request...';

      const startTime = Date.now();
      try {
        const res = await fetch(endpoint);
        const duration = Date.now() - startTime;
        const json = await res.json();

        title.innerText = endpoint + ' (' + duration + ' ms)';
        badge.innerText = res.status + ' ' + res.statusText;
        badge.style.color = res.ok ? '#10b981' : '#ef4444';
        jsonPre.innerText = JSON.stringify(json, null, 2);
      } catch (err) {
        title.innerText = endpoint + ' (Failed)';
        badge.innerText = 'Error';
        badge.style.color = '#ef4444';
        jsonPre.innerText = err.message;
      }
    }

    function updateRefreshInterval(val) {
      if (activeInterval) clearInterval(activeInterval);
      const ms = parseInt(val, 10);
      if (ms > 0) {
        activeInterval = setInterval(refreshDashboard, ms);
        showToast('Auto-refresh set to ' + (ms / 1000) + 's');
      } else {
        showToast('Auto-refresh paused');
      }
    }

    function copyRawJson() {
      const text = document.getElementById('rawJsonBlock').innerText;
      navigator.clipboard.writeText(text).then(() => {
        showToast('JSON copied to clipboard!');
      });
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toastMsg');
      toastMsg.innerText = msg;
      toast.style.display = 'flex';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 2500);
    }

    // Set initial auto-refresh
    window.addEventListener('DOMContentLoaded', () => {
      updateRefreshInterval(5000);
    });
  </script>
</body>
</html>`;
}

module.exports = {
  renderHealthDashboard
};
