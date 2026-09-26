import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DemoPanel from '../components/DemoPanel';
import api from '../services/api';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [systemStatus, setSystemStatus] = useState({});
  const [demoMode, setDemoMode] = useState(false);

  // Poll alert count
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts?reviewed=false');
        setAlertCount(res.data.unresolvedCount || 0);
      } catch { /* silent */ }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Poll system health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.get('/health');
        setSystemStatus({
          backend: res.data.status === 'ONLINE',
          ml: res.data.mlService === 'HEALTHY',
          database: res.data.database === 'CONNECTED',
        });
      } catch {
        setSystemStatus({ backend: false, ml: false, database: false });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        alertCount={alertCount}
        systemStatus={systemStatus}
      />
      <div className="main-content">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          alertCount={alertCount}
          demoMode={demoMode}
          onDemoToggle={() => setDemoMode(v => !v)}
        />
        {demoMode && <DemoPanel onClose={() => setDemoMode(false)} />}
        <main className="page-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
