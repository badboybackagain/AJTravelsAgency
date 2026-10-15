import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Save,
  Key,
  Smartphone,
  Server,
  RefreshCw,
  Power,
  Clock,
  Radio,
  Check,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { adminWhatsAppApi } from '../../services/api';
import './admin.css';

export const AdminWhatsAppSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [refreshingLogs, setRefreshingLogs] = useState(false);

  // Alert State
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }
  const [verifyResult, setVerifyResult] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Form Fields
  const [isEnabled, setIsEnabled] = useState(false);
  const [notifyBookings, setNotifyBookings] = useState(true);
  const [notifyEnquiries, setNotifyEnquiries] = useState(true);
  const [senderId, setSenderId] = useState(''); // WhatsApp Account ID
  const [apiKey, setApiKey] = useState(''); // API Secret
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [destinationNumber, setDestinationNumber] = useState('');
  const [testDestination, setTestDestination] = useState('');

  // Status & Logs
  const [lastStatus, setLastStatus] = useState('UNCONFIGURED');
  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [logs, setLogs] = useState([]);

  // Load Settings on Mount
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await adminWhatsAppApi.getSettings();
      if (res.data?.success) {
        const d = res.data.data;
        setIsEnabled(Boolean(d.isEnabled));
        setNotifyBookings(d.notifyBookings ?? true);
        setNotifyEnquiries(d.notifyEnquiries ?? true);
        setSenderId(d.senderId || '');
        setApiKey(d.apiKey || '');
        setHasApiKey(Boolean(d.hasApiKey));
        setDestinationNumber(d.destinationNumber || '');
        setTestDestination(d.destinationNumber || '');
        setLastStatus(d.lastStatus || 'UNCONFIGURED');
        setLastVerifiedAt(d.lastVerifiedAt || null);
        setLastError(d.lastError || null);
        setLogs(d.recentLogs || []);
        setIsEditingKey(false);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp settings:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load WhatsApp settings from server.',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshLogs = async () => {
    try {
      setRefreshingLogs(true);
      const res = await adminWhatsAppApi.getLogs();
      if (res.data?.success) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to refresh logs:', err);
    } finally {
      setRefreshingLogs(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Handle Form Submit
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    setVerifyResult(null);
    setTestResult(null);

    // Validate destination number if notifications enabled
    if (isEnabled && !destinationNumber.trim()) {
      setAlert({
        type: 'error',
        message: 'Destination WhatsApp number is required when notifications are enabled.',
      });
      setSaving(false);
      return;
    }

    try {
      const payload = {
        isEnabled,
        notifyBookings,
        notifyEnquiries,
        senderId: senderId.trim(),
        destinationNumber: destinationNumber.trim(),
      };

      // Only send apiKey if actively updated or entered for the first time
      if (isEditingKey || !hasApiKey) {
        payload.apiKey = apiKey.trim();
      }

      const res = await adminWhatsAppApi.updateSettings(payload);
      if (res.data?.success) {
        const updated = res.data.data;
        setIsEnabled(Boolean(updated.isEnabled));
        setNotifyBookings(updated.notifyBookings ?? true);
        setNotifyEnquiries(updated.notifyEnquiries ?? true);
        setSenderId(updated.senderId || '');
        setApiKey(updated.apiKey || '');
        setHasApiKey(Boolean(updated.hasApiKey));
        setIsEditingKey(false);
        setLastStatus(updated.lastStatus);
        setAlert({
          type: 'success',
          message: 'WhatsApp configuration saved securely.',
        });
        refreshLogs();
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Error saving settings. Please check required fields.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Real-time Gateway Verification
  const handleVerifyGateway = async () => {
    setVerifying(true);
    setVerifyResult(null);
    setAlert(null);

    try {
      const payload = {};
      if (isEditingKey && apiKey.trim()) {
        payload.apiKey = apiKey.trim();
      }
      if (senderId.trim()) {
        payload.senderId = senderId.trim();
      }

      const res = await adminWhatsAppApi.verifyConnection(payload);
      if (res.data?.success) {
        setVerifyResult({
          success: true,
          status: res.data.status,
          message: res.data.message || 'Gateway connection verified with Wasms successfully.',
        });
        setLastStatus('CONNECTED');
        setLastVerifiedAt(new Date().toISOString());
        setLastError(null);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Verification failed.';
      setVerifyResult({
        success: false,
        status: 'ERROR',
        message: errMsg,
      });
      setLastStatus('ERROR');
      setLastError(errMsg);
    } finally {
      setVerifying(false);
    }
  };

  // Handle Send Test Message
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setAlert(null);

    const target = testDestination.trim() || destinationNumber.trim();
    if (!target) {
      setAlert({
        type: 'error',
        message: 'Please provide a valid destination phone number for the test message.',
      });
      setTesting(false);
      return;
    }

    try {
      const res = await adminWhatsAppApi.test(target);
      if (res.data?.success) {
        setTestResult({
          success: true,
          status: res.data.status,
          message: 'Test message accepted by Wasms gateway.',
          details: res.data.data,
        });
        setLastStatus('CONNECTED');
        setLastVerifiedAt(new Date().toISOString());
        setLastError(null);
        refreshLogs();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Test message failed.';
      setTestResult({
        success: false,
        status: err.response?.data?.status || 'FAILED',
        message: errMsg,
      });
      setLastStatus('ERROR');
      setLastError(errMsg);
      refreshLogs();
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-container">
        <Loader2 className="animate-spin" size={32} color="#C89B3C" />
        <p>Loading WhatsApp settings...</p>
      </div>
    );
  }

  return (
    <div className="admin-section-container">
      {/* Page Header */}
      <div className="admin-header-row">
        <div>
          <h2 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MessageSquare color="#25D366" size={24} /> WhatsApp Notifications & OTP Settings
          </h2>
          <p className="admin-page-subtitle">
            Wasms Gateway (<span style={{ fontFamily: 'monospace', color: '#0284C7' }}>https://wasms.nirosha.org</span>) Configuration
          </p>
        </div>
      </div>

      {/* Global Alert */}
      {alert && (
        <div
          className={`admin-alert ${alert.type}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1.1rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            backgroundColor: alert.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: alert.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
            color: alert.type === 'success' ? '#065F46' : '#991B1B',
            fontWeight: 600,
            fontSize: '0.88rem',
          }}
        >
          {alert.type === 'success' ? <CheckCircle2 size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
          <span style={{ flex: 1 }}>{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid: Settings Form & Status/Test Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Clean Configuration Form */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={18} color="#0284C7" /> Gateway Credentials & Routing
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 700 }}>
              Encrypted Server-Side Storage
            </span>
          </div>

          <form onSubmit={handleSave} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* 1. Master Enable/Disable Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.1rem',
              borderRadius: '10px',
              backgroundColor: isEnabled ? '#F0FDF4' : '#F8FAFC',
              border: isEnabled ? '1.5px solid #86EFAC' : '1.5px solid #E2E8F0',
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isEnabled ? '#15803D' : '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Power size={16} /> WhatsApp Service: {isEnabled ? 'ENABLED' : 'PAUSED'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                  {isEnabled
                    ? 'Active: Booking confirmations, OTP delivery, and enquiry alerts will dispatch.'
                    : 'Paused: No messages or OTPs will be sent. Enquiries and bookings will still save.'}
                </div>
              </div>

              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: isEnabled ? '#25D366' : '#CBD5E1',
                    borderRadius: '26px',
                    transition: '0.3s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      content: '',
                      height: '20px',
                      width: '20px',
                      left: isEnabled ? '24px' : '3px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </span>
              </label>
            </div>

            {/* 2. Independent Notification Toggles */}
            <div style={{
              padding: '0.9rem 1.1rem',
              borderRadius: '10px',
              backgroundColor: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Notification Event Toggles
              </div>

              {/* Booking Notifications Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>
                    Booking Confirmation Alerts
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                    Send operational alert to admin when a new booking is confirmed
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyBookings}
                  onChange={(e) => setNotifyBookings(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#25D366', cursor: 'pointer' }}
                />
              </div>

              <div style={{ height: '1px', backgroundColor: '#E2E8F0' }} />

              {/* Enquiry Notifications Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>
                    Customer Enquiry Alerts
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                    Send operational alert to admin when a customer submits a trip enquiry
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEnquiries}
                  onChange={(e) => setNotifyEnquiries(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#25D366', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* 3. WhatsApp Account ID */}
            <div>
              <label className="admin-form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Radio size={14} color="#0284C7" /> WhatsApp Account ID
              </label>
              <input
                type="text"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                placeholder="e.g. 1, 2, or your connected WhatsApp account ID"
                className="admin-input"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '0.88rem' }}
              />
              <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.25rem' }}>
                The Account / Session ID from your Wasms dashboard. Required when dispatching messages from a specific WhatsApp device.
              </div>
            </div>

            {/* 4. API Secret Credential */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="admin-form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Key size={14} color="#C89B3C" /> API Secret Credential *
                </label>
                {hasApiKey && !isEditingKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingKey(true);
                      setApiKey('');
                    }}
                    style={{ fontSize: '0.74rem', color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Change Secret
                  </button>
                )}
                {isEditingKey && hasApiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingKey(false);
                      loadSettings();
                    }}
                    style={{ fontSize: '0.74rem', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isEditingKey && hasApiKey ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.85rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  color: '#475569',
                  fontFamily: 'monospace',
                  fontSize: '0.88rem',
                }}>
                  <ShieldCheck size={16} color="#16A34A" />
                  <span>{apiKey || '••••••••'}</span>
                  <span style={{ fontSize: '0.72rem', color: '#16A34A', marginLeft: 'auto', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Check size={13} /> Saved & Masked
                  </span>
                </div>
              ) : (
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Wasms API secret credential"
                  className="admin-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '0.88rem' }}
                />
              )}
              <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.25rem' }}>
                Your secret is stored securely on the server and is never returned in plaintext to the browser.
              </div>
            </div>

            {/* 5. Destination WhatsApp Number */}
            <div>
              <label className="admin-form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Smartphone size={14} color="#C89B3C" /> Admin Notification Phone Number *
              </label>
              <input
                type="text"
                value={destinationNumber}
                onChange={(e) => setDestinationNumber(e.target.value)}
                placeholder="+91 98220 12345"
                className="admin-input"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '0.88rem' }}
              />
              <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.25rem' }}>
                Operational WhatsApp number where booking and enquiry notifications will be sent (include country code).
              </div>
            </div>

            {/* Save Button */}
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                className="admin-btn-primary"
                style={{ padding: '0.75rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving Configuration...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Configuration
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Connection Diagnostics & Live Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Card A: Gateway Connection & Verification */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={17} color="#16A34A" /> Gateway Connection
              </h3>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Connection Status:</span>
                <span
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    backgroundColor:
                      lastStatus === 'CONNECTED'
                        ? '#DCFCE7'
                        : lastStatus === 'ERROR'
                        ? '#FEE2E2'
                        : '#F1F5F9',
                    color:
                      lastStatus === 'CONNECTED'
                        ? '#15803D'
                        : lastStatus === 'ERROR'
                        ? '#B91C1C'
                        : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor:
                        lastStatus === 'CONNECTED'
                          ? '#16A34A'
                          : lastStatus === 'ERROR'
                          ? '#DC2626'
                          : '#94A3B8',
                    }}
                  />
                  {lastStatus}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Last Verification:</span>
                <span style={{ fontSize: '0.82rem', color: '#0F172A', fontWeight: 700 }}>
                  {lastVerifiedAt
                    ? new Date(lastVerifiedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                    : 'Not yet verified'}
                </span>
              </div>

              {lastError && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: '#991B1B',
                  lineHeight: 1.4,
                }}>
                  <strong>Gateway Notice:</strong> {lastError}
                </div>
              )}

              {/* Verify Gateway Button */}
              <button
                type="button"
                onClick={handleVerifyGateway}
                disabled={verifying}
                className="admin-btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.3rem',
                }}
              >
                {verifying ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Verifying Gateway (~30s)...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} color="#0284C7" /> Verify Gateway Connection
                  </>
                )}
              </button>

              {/* Verify Result Feedback */}
              {verifyResult && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  backgroundColor: verifyResult.success ? '#F0FDF4' : '#FEF2F2',
                  border: verifyResult.success ? '1px solid #BBF7D0' : '1px solid #FECACA',
                  color: verifyResult.success ? '#166534' : '#991B1B',
                  fontWeight: 600,
                }}>
                  {verifyResult.success ? '✓ ' : '✕ '} {verifyResult.message}
                </div>
              )}

            </div>
          </div>

          {/* Card B: Live Test Message */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Send size={17} color="#25D366" /> Send Test Message
              </h3>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45, margin: 0 }}>
                Dispatches an administrative test message via Wasms WhatsApp API to confirm outbound routing.
              </p>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Test Target Phone Number
                </label>
                <input
                  type="text"
                  value={testDestination}
                  onChange={(e) => setTestDestination(e.target.value)}
                  placeholder="+91 98220 12345"
                  className="admin-input"
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="btn-whatsapp"
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: testing ? 'not-allowed' : 'pointer',
                  opacity: testing ? 0.75 : 1,
                }}
              >
                {testing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Dispatching Test...
                  </>
                ) : (
                  <>
                    <Send size={15} /> Send Test Message
                  </>
                )}
              </button>

              {/* Test Result Feedback */}
              {testResult && (
                <div style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                  backgroundColor: testResult.success ? '#F0FDF4' : '#FEF2F2',
                  border: testResult.success ? '1px solid #BBF7D0' : '1px solid #FECACA',
                  color: testResult.success ? '#166534' : '#991B1B',
                }}>
                  <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>
                    {testResult.success ? '✅ Provider Accepted Request' : '❌ Test Dispatch Failed'}
                  </div>
                  <div>{testResult.message}</div>
                  {testResult.success && (
                    <div style={{ fontSize: '0.72rem', color: '#15803D', marginTop: '0.35rem', fontStyle: 'italic' }}>
                      Notice: Wasms accepted the request. Final delivery requires an active session on your WhatsApp device.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Section: Delivery Audit Logs */}
      <div className="admin-card" style={{ marginTop: '1.75rem' }}>
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={17} color="#0284C7" /> Notification Delivery Audit Log
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
              Live audit history of WhatsApp dispatches (credentials and secrets are never logged)
            </span>
          </div>

          <button
            type="button"
            onClick={refreshLogs}
            disabled={refreshingLogs}
            className="admin-btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RefreshCw size={13} className={refreshingLogs ? 'animate-spin' : ''} />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="admin-table-container">
          {logs.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.88rem' }}>
              No notification events recorded yet.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Provider Details / Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const statusColors = {
                    ACCEPTED: { bg: '#DCFCE7', text: '#15803D', label: 'Accepted' },
                    DELIVERED: { bg: '#DCFCE7', text: '#15803D', label: 'Delivered' },
                    SENT: { bg: '#DCFCE7', text: '#15803D', label: 'Sent' },
                    SKIPPED_DISABLED: { bg: '#F1F5F9', text: '#475569', label: 'Skipped (Disabled)' },
                    FAILED: { bg: '#FEE2E2', text: '#B91C1C', label: 'Failed' },
                  };
                  const color = statusColors[log.status] || { bg: '#F1F5F9', text: '#475569', label: log.status };

                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: '#64748B' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A' }}>
                        {log.eventType === 'ENQUIRY' ? '🔔 Customer Enquiry' : log.eventType === 'BOOKING_CREATED' ? '🚗 New Booking' : log.eventType === 'ADMIN_TEST' ? '🧪 Test Message' : log.eventType}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#334155' }}>
                        {log.recipient}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            backgroundColor: color.bg,
                            color: color.text,
                          }}
                        >
                          {color.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: log.errorMessage ? '#B91C1C' : '#64748B', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.errorMessage || (log.providerResponse ? 'Wasms gateway accepted' : 'Success')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};



