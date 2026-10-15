// Database connection state tracker
// Provides centralized visibility into database connectivity across server and middleware

const state = {
  connected: false,
  error: null,
};

function setDbConnected(status, error = null) {
  state.connected = !!status;
  state.error = error;
}

function getDbStatus() {
  return { ...state };
}

module.exports = { setDbConnected, getDbStatus };
