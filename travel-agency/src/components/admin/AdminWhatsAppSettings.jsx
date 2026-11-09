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
  RefreshCw,
  Power,
  Clock,
  Radio,
  Check,
  Globe,
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
  const [alert, setAlert] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Provider State
  const [activeProvider, setActiveProvider] = useState('WASMS');
  const [selectedProvider, setSelectedProvider] = useState('WASMS');

  // Common Form Fields
  const [isEnabled, setIsEnabled] = useState(false);
  const [notifyBookings, setNotifyBookings] = useState(true);
  const [notifyEnquiries, setNotifyEnquiries] = useState(true);
  const [destinationNumber, setDestinationNumber] = useState('');
  const [testDestination, setTestDestination] = useState('');

  // Provider 1: Wasms Legacy Credentials & Status
  const [apiUrl, setApiUrl] = useState('https://wasms.nirosha.org');
  const [senderId, setSenderId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [lastStatus, setLastStatus] = useState('UNCONFIGURED');
  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);
  const [lastError, setLastError] = useState(null);

  // Provider 2: WASMS Next Credentials & Status
  const [nextApiUrl, setNextApiUrl] = useState('https://wasmsnext.nirosha.org/api/v1/messages/whatsapp');
  const [nextAccountId, setNextAccountId] = useState('');
  const [nextApiKey, setNextApiKey] = useState('');
  const [isEditingNextKey, setIsEditingNextKey] = useState(false);
  const [hasNextApiKey, setHasNextApiKey] = useState(false);
  const [nextLastStatus, setNextLastStatus] = useState('UNCONFIGURED');
  const [nextLastVerifiedAt, setNextLastVerifiedAt] = useState(null);
  const [nextLastError, setNextLastError] = useState(null);

  // Delivery Logs
  const [logs, setLogs] = useState([]);

  // Load Settings on Mount
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await adminWhatsAppApi.getSettings();
      if (res.data?.success) {
        const d = res.data.data;
        const currentActive = d.provider === 'WASMS_NEXT' ? 'WASMS_NEXT' : 'WASMS';
        setActiveProvider(currentActive);
        setSelectedProvider(currentActive);

        setIsEnabled(Boolean(d.isEnabled));
        setNotifyBookings(d.notifyBookings ?? true);
        setNotifyEnquiries(d.notifyEnquiries ?? true);
        setDestinationNumber(d.destinationNumber || '');
        setTestDestination(d.destinationNumber || '');

        // Legacy Wasms
        setApiUrl(d.apiUrl || 'https://wasms.nirosha.org');
        setSenderId(d.senderId || '');
        setApiKey(d.apiKey || '');
        setHasApiKey(Boolean(d.hasApiKey));
        setLastStatus(d.lastStatus || 'UNCONFIGURED');
        setLastVerifiedAt(d.lastVerifiedAt || null);
        setLastError(d.lastError || null);
        setIsEditingKey(false);

        // WASMS Next
        setNextApiUrl(d.nextApiUrl || 'https://wasmsnext.nirosha.org/api/v1/messages/whatsapp');
        setNextAccountId(d.nextAccountId || '');
        setNextApiKey(d.nextApiKey || '');
        setHasNextApiKey(Boolean(d.hasNextApiKey));
        setNextLastStatus(d.nextLastStatus || 'UNCONFIGURED');
        setNextLastVerifiedAt(d.nextLastVerifiedAt || null);
        setNextLastError(d.nextLastError || null);
        setIsEditingNextKey(false);

        setLogs(d.recentLogs || []);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp settings:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load WhatsApp settings.',
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
    if (e) e.preventDefault();
    setSaving(true);
    setAlert(null);
    setVerifyResult(null);
    setTestResult(null);

    if (isEnabled && !destinationNumber.trim()) {
      setAlert({
        type: 'error',
        message: 'Destination phone number is required when WhatsApp service is enabled.',
      });
      setSaving(false);
      return;
    }

    try {
      const payload = {
        provider: selectedProvider,
        isEnabled,
        notifyBookings,
        notifyEnquiries,
        destinationNumber: destinationNumber.trim(),
        apiUrl: apiUrl.trim() || 'https://wasms.nirosha.org',
        senderId: senderId.trim(),
        nextApiUrl: nextApiUrl.trim() || 'https://wasmsnext.nirosha.org/api/v1/messages/whatsapp',
        nextAccountId: nextAccountId.trim(),
      };

      if (isEditingKey || !hasApiKey) {
        payload.apiKey = apiKey.trim();
      }

      if (isEditingNextKey || !hasNextApiKey) {
        payload.nextApiKey = nextApiKey.trim();
      }

      const res = await adminWhatsAppApi.updateSettings(payload);
      if (res.data?.success) {
        const updated = res.data.data;
        const savedProvider = updated.provider || 'WASMS';
        setActiveProvider(savedProvider);
        setSelectedProvider(savedProvider);

        setIsEnabled(Boolean(updated.isEnabled));
        setNotifyBookings(updated.notifyBookings ?? true);
        setNotifyEnquiries(updated.notifyEnquiries ?? true);
        setDestinationNumber(updated.destinationNumber || '');

        setApiUrl(updated.apiUrl || 'https://wasms.nirosha.org');
        setSenderId(updated.senderId || '');
        setApiKey(updated.apiKey || '');
        setHasApiKey(Boolean(updated.hasApiKey));
        setIsEditingKey(false);
        setLastStatus(updated.lastStatus);

        setNextApiUrl(updated.nextApiUrl || 'https://wasmsnext.nirosha.org/api/v1/messages/whatsapp');
        setNextAccountId(updated.nextAccountId || '');
        setNextApiKey(updated.nextApiKey || '');
        setHasNextApiKey(Boolean(updated.hasNextApiKey));
        setIsEditingNextKey(false);
        setNextLastStatus(updated.nextLastStatus);

        setAlert({
          type: 'success',
          message: 'Settings saved successfully.',
        });
        refreshLogs();
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Error saving settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Verify Connection
  const handleVerifyGateway = async () => {
    setVerifying(true);
    setVerifyResult(null);
    setAlert(null);

    try {
      const payload = { provider: selectedProvider };
      if (selectedProvider === 'WASMS') {
        if (apiUrl.trim()) payload.apiUrl = apiUrl.trim();
        if (isEditingKey && apiKey.trim()) payload.apiKey = apiKey.trim();
        if (senderId.trim()) payload.senderId = senderId.trim();
      } else {
        if (nextApiUrl.trim()) payload.nextApiUrl = nextApiUrl.trim();
        if (isEditingNextKey && nextApiKey.trim()) payload.nextApiKey = nextApiKey.trim();
        if (nextAccountId.trim()) payload.nextAccountId = nextAccountId.trim();
      }

      const res = await adminWhatsAppApi.verifyConnection(payload);
      if (res.data?.success) {
        setVerifyResult({
          success: true,
          message: 'Connection verified successfully.',
        });

        if (selectedProvider === 'WASMS') {
          setLastStatus('CONNECTED');
          setLastVerifiedAt(new Date().toISOString());
          setLastError(null);
        } else {
          setNextLastStatus('CONNECTED');
          setNextLastVerifiedAt(new Date().toISOString());
          setNextLastError(null);
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Verification failed.';
      setVerifyResult({
        success: false,
        message: errMsg,
      });

      if (selectedProvider === 'WASMS') {
        setLastStatus('ERROR');
        setLastError(errMsg);
      } else {
        setNextLastStatus('ERROR');
        setNextLastError(errMsg);
      }
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
        message: 'Please provide a valid destination phone number.',
      });
      setTesting(false);
      return;
    }

    try {
      const res = await adminWhatsAppApi.test({
        destinationNumber: target,
        provider: selectedProvider,
      });

      if (res.data?.success) {
        setTestResult({
          success: true,
          message: 'Test message sent successfully.',
        });

        if (selectedProvider === 'WASMS') {
          setLastStatus('CONNECTED');
          setLastVerifiedAt(new Date().toISOString());
          setLastError(null);
        } else {
          setNextLastStatus('CONNECTED');
          setNextLastVerifiedAt(new Date().toISOString());
          setNextLastError(null);
        }
        refreshLogs();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Test message failed.';
      setTestResult({
        success: false,
        message: errMsg,
      });

      if (selectedProvider === 'WASMS') {
        setLastStatus('ERROR');
        setLastError(errMsg);
      } else {
        setNextLastStatus('ERROR');
        setNextLastError(errMsg);
      }
      refreshLogs();
    } finally {
      setTesting(false);
    }
  };

  const currentStatus = selectedProvider === 'WASMS_NEXT' ? nextLastStatus : lastStatus;
  const currentVerifiedAt = selectedProvider === 'WASMS_NEXT' ? nextLastVerifiedAt : lastVerifiedAt;
  const currentError = selectedProvider === 'WASMS_NEXT' ? nextLastError : lastError;

  if (loading) {
    return (
      <div className="admin-loading-container">
        <Loader2 className="animate-spin" size={28} color="#C89B3C" />
        <p style={{ fontSize: '0.88rem', color: '#64748B' }}>Loading WhatsApp settings...</p>
      </div>
    );
  }

  return (
    <div className="admin-section-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 className="admin-page-title" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <MessageSquare color="#25D366" size={22} /> WhatsApp Integration
        </h2>
        <p className="admin-page-subtitle" style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem', margin: 0 }}>
          Manage providers and notification settings.
        </p>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div
          className={`admin-alert ${alert.type}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.9rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            backgroundColor: alert.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: alert.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
            color: alert.type === 'success' ? '#065F46' : '#991B1B',
            fontWeight: 600,
            fontSize: '0.84rem',
          }}
        >
          {alert.type === 'success' ? <CheckCircle2 size={16} color="#10B981" /> : <AlertCircle size={16} color="#EF4444" />}
          <span style={{ flex: 1 }}>{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Left Column: Configuration Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* Section 1 — WhatsApp Service */}
          <div className="admin-card" style={{ padding: '0.85rem 1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Power size={17} color={isEnabled ? '#16A34A' : '#94A3B8'} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                  WhatsApp Service:
                </span>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: isEnabled ? '#15803D' : '#64748B',
                  backgroundColor: isEnabled ? '#DCFCE7' : '#F1F5F9',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                }}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '42px', height: '22px' }}>
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
                    borderRadius: '22px',
                    transition: '0.25s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      height: '16px',
                      width: '16px',
                      left: isEnabled ? '22px' : '3px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.25s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </span>
              </label>
            </div>
          </div>

          {/* Section 2 — Outbound Provider */}
          <div className="admin-card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Outbound Provider
              </span>
              <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                Only the selected provider receives messages.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Radio 1: Current WhatsApp */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selectedProvider === 'WASMS' ? '2px solid #25D366' : '1.5px solid #E2E8F0',
                  backgroundColor: selectedProvider === 'WASMS' ? '#F0FDF4' : '#FFFFFF',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    name="provider_choice"
                    value="WASMS"
                    checked={selectedProvider === 'WASMS'}
                    onChange={() => setSelectedProvider('WASMS')}
                    style={{ accentColor: '#25D366', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>Current WhatsApp</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Existing gateway</div>
                  </div>
                </div>
                {selectedProvider === 'WASMS' && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '6px',
                  }}>
                    Active
                  </span>
                )}
              </label>

              {/* Radio 2: WASMS Next */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selectedProvider === 'WASMS_NEXT' ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
                  backgroundColor: selectedProvider === 'WASMS_NEXT' ? '#F0F9FF' : '#FFFFFF',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    name="provider_choice"
                    value="WASMS_NEXT"
                    checked={selectedProvider === 'WASMS_NEXT'}
                    onChange={() => setSelectedProvider('WASMS_NEXT')}
                    style={{ accentColor: '#0284C7', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>WASMS Next</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>V1 API</div>
                  </div>
                </div>
                {selectedProvider === 'WASMS_NEXT' && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    backgroundColor: '#E0F2FE',
                    color: '#0369A1',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '6px',
                  }}>
                    Active
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Section 3 — Provider Configuration */}
          <div className="admin-card" style={{ padding: '1.1rem' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Globe size={16} color="#0284C7" /> {selectedProvider === 'WASMS_NEXT' ? 'WASMS Next Configuration' : 'Current WhatsApp Configuration'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {selectedProvider === 'WASMS' ? (
                <>
                  {/* Current WhatsApp Fields */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="https://wasms.nirosha.org"
                      className="admin-input"
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '7px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      Account ID
                    </label>
                    <input
                      type="text"
                      value={senderId}
                      onChange={(e) => setSenderId(e.target.value)}
                      placeholder="e.g. 1"
                      className="admin-input"
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '7px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                        API Secret
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
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '7px',
                        border: '1.5px solid #CBD5E1',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        color: '#475569',
                      }}>
                        <span>{apiKey || '••••••••'}</span>
                        <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={12} /> Masked
                        </span>
                      </div>
                    ) : (
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter API secret"
                        className="admin-input"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '7px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* WASMS Next Fields */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      value={nextApiUrl}
                      onChange={(e) => setNextApiUrl(e.target.value)}
                      placeholder="https://wasmsnext.nirosha.org/api/v1/messages/whatsapp"
                      className="admin-input"
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '7px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      WhatsApp Account ID (optional)
                    </label>
                    <input
                      type="text"
                      value={nextAccountId}
                      onChange={(e) => setNextAccountId(e.target.value)}
                      placeholder="Optional (defaults to default linked device)"
                      className="admin-input"
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '7px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                        Bearer Token
                      </label>
                      {hasNextApiKey && !isEditingNextKey && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingNextKey(true);
                            setNextApiKey('');
                          }}
                          style={{ fontSize: '0.74rem', color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                        >
                          Change Token
                        </button>
                      )}
                      {isEditingNextKey && hasNextApiKey && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingNextKey(false);
                            loadSettings();
                          }}
                          style={{ fontSize: '0.74rem', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {!isEditingNextKey && hasNextApiKey ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '7px',
                        border: '1.5px solid #CBD5E1',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        color: '#475569',
                      }}>
                        <span>{nextApiKey || '••••••••'}</span>
                        <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={12} /> Masked
                        </span>
                      </div>
                    ) : (
                      <input
                        type="password"
                        value={nextApiKey}
                        onChange={(e) => setNextApiKey(e.target.value)}
                        placeholder="Enter WASMS Next Bearer token"
                        className="admin-input"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '7px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Save Button */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                className="admin-btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} /> Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 6 — Notification Events */}
          <div className="admin-card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Notification Events & Destination
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  Admin Notification Phone Number
                </label>
                <input
                  type="text"
                  value={destinationNumber}
                  onChange={(e) => setDestinationNumber(e.target.value)}
                  placeholder="+91 98220 12345"
                  className="admin-input"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '7px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifyBookings}
                    onChange={(e) => setNotifyBookings(e.target.checked)}
                    style={{ accentColor: '#25D366', cursor: 'pointer' }}
                  />
                  Booking Alerts
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifyEnquiries}
                    onChange={(e) => setNotifyEnquiries(e.target.checked)}
                    style={{ accentColor: '#25D366', cursor: 'pointer' }}
                  />
                  Enquiry Alerts
                </label>
              </div>
            </div>
          </div>

        </form>

        {/* Right Column: Connection Diagnostics & Test Message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* Section 4 — Connection Status */}
          <div className="admin-card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={16} color={currentStatus === 'CONNECTED' ? '#16A34A' : '#64748B'} /> Connection Status
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Status:</span>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor:
                      currentStatus === 'CONNECTED'
                        ? '#DCFCE7'
                        : currentStatus === 'ERROR'
                        ? '#FEE2E2'
                        : '#F1F5F9',
                    color:
                      currentStatus === 'CONNECTED'
                        ? '#15803D'
                        : currentStatus === 'ERROR'
                        ? '#B91C1C'
                        : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor:
                        currentStatus === 'CONNECTED'
                          ? '#16A34A'
                          : currentStatus === 'ERROR'
                          ? '#DC2626'
                          : '#94A3B8',
                    }}
                  />
                  {currentStatus}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Last Verified:</span>
                <span style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600 }}>
                  {currentVerifiedAt
                    ? new Date(currentVerifiedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Not yet verified'}
                </span>
              </div>

              {currentError && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  color: '#991B1B',
                  lineHeight: 1.35,
                }}>
                  {currentError}
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyGateway}
                disabled={verifying}
                className="admin-btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: '7px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  marginTop: '0.25rem',
                }}
              >
                {verifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} /> Verify Connection
                  </>
                )}
              </button>

              {verifyResult && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
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

          {/* Section 5 — Test Message */}
          <div className="admin-card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Send size={15} color="#25D366" /> Test Message
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  Destination Phone Number
                </label>
                <input
                  type="text"
                  value={testDestination}
                  onChange={(e) => setTestDestination(e.target.value)}
                  placeholder="+91 98220 12345"
                  className="admin-input"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '7px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="btn-whatsapp"
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: '7px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  cursor: testing ? 'not-allowed' : 'pointer',
                  opacity: testing ? 0.75 : 1,
                }}
              >
                {testing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Send Test Message
                  </>
                )}
              </button>

              {testResult && (
                <div style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  lineHeight: 1.35,
                  backgroundColor: testResult.success ? '#F0FDF4' : '#FEF2F2',
                  border: testResult.success ? '1px solid #BBF7D0' : '1px solid #FECACA',
                  color: testResult.success ? '#166534' : '#991B1B',
                  fontWeight: 600,
                }}>
                  {testResult.success ? '✓ ' : '✕ '} {testResult.message}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="admin-card" style={{ marginTop: '1.5rem', padding: '1rem 1.1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="#0284C7" /> Notification Delivery Log
            </div>
          </div>

          <button
            type="button"
            onClick={refreshLogs}
            disabled={refreshingLogs}
            className="admin-btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RefreshCw size={12} className={refreshingLogs ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="admin-table-container">
          {logs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
              No notification events recorded yet.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>Provider</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const statusColors = {
                    ACCEPTED: { bg: '#DCFCE7', text: '#15803D', label: 'Accepted' },
                    DELIVERED: { bg: '#DCFCE7', text: '#15803D', label: 'Delivered' },
                    SENT: { bg: '#DCFCE7', text: '#15803D', label: 'Sent' },
                    SKIPPED_DISABLED: { bg: '#F1F5F9', text: '#475569', label: 'Skipped' },
                    FAILED: { bg: '#FEE2E2', text: '#B91C1C', label: 'Failed' },
                  };
                  const color = statusColors[log.status] || { bg: '#F1F5F9', text: '#475569', label: log.status };
                  const isWasmsNext = log.provider === 'WASMS_NEXT';

                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#64748B' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0F172A' }}>
                        {log.eventType === 'ENQUIRY' ? 'Enquiry' : log.eventType === 'BOOKING_CREATED' ? 'Booking' : log.eventType === 'ADMIN_TEST' ? 'Test' : log.eventType}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: isWasmsNext ? '#E0F2FE' : '#DCFCE7',
                            color: isWasmsNext ? '#0369A1' : '#15803D',
                          }}
                        >
                          {isWasmsNext ? 'WASMS Next' : 'Current'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#334155' }}>
                        {log.recipient}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: color.bg,
                            color: color.text,
                          }}
                        >
                          {color.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: log.errorMessage ? '#B91C1C' : '#64748B', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.errorMessage || 'Success'}
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
