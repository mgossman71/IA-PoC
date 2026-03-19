import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "../api";
import FailureModeModal from "./FailureModeModal";

const HEARTBEAT_MS = 5 * 60 * 1000;

function LockCountdown({ expiresAt, onExpired }) {
  const [label, setLabel] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) {
        setLabel("Lock has expired");
        setExpired(true);
        onExpired?.();
        return false; // stop ticking
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${m}m ${String(s).padStart(2, "0")}s remaining`);
      return true;
    };

    if (!tick()) return;
    const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  return (
    <span style={{ fontWeight: expired ? 700 : 400, color: expired ? "#c62828" : "inherit" }}>
      {label}
    </span>
  );
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function RpnBadge({ rpn }) {
  if (!rpn) return <span className="rpn-badge rpn-none">—</span>;
  const cls = rpn < 50 ? "rpn-low" : rpn < 150 ? "rpn-medium" : "rpn-high";
  return <span className={`rpn-badge ${cls}`}>{rpn}</span>;
}

function DepSevBadge({ value }) {
  const cls = { Hard: "sev-hard", Soft: "sev-soft", Optional: "sev-optional", "Boot-Only": "sev-boot" };
  if (!value) return <span className="text-muted">—</span>;
  return <span className={`dep-sev-badge ${cls[value] || ""}`}>{value}</span>;
}

export default function CIEditor({ ciId, userName, sessionId, onBack }) {
  const [ci, setCi] = useState(null);
  const [failureModes, setFailureModes] = useState([]);
  const [lockOwned, setLockOwned] = useState(false);
  const [lockInfo, setLockInfo] = useState(null);
  const [lockExpired, setLockExpired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFM, setEditingFM] = useState(null);
  const [jsonFM, setJsonFM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const heartbeatRef = useRef(null);
  const lockOwnedRef = useRef(false);

  useEffect(() => { lockOwnedRef.current = lockOwned; }, [lockOwned]);

  // Load CI data and attempt to acquire lock
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const data = await api.getCI(ciId);
        if (!mounted) return;
        setCi(data);
        setFailureModes(data.failure_modes || []);

        try {
          await api.acquireLock(ciId, userName, sessionId);
          if (!mounted) return;
          setLockOwned(true);
          heartbeatRef.current = setInterval(
            () => api.sendHeartbeat(ciId, userName, sessionId).catch(console.warn),
            HEARTBEAT_MS
          );
        } catch (lockErr) {
          if (!mounted) return;
          if (lockErr.status === 423) {
            setLockInfo(lockErr.detail);
          } else {
            console.warn("Lock error:", lockErr);
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load CI");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, [ciId, userName, sessionId]);

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (lockOwnedRef.current) {
        api.releaseLock(ciId, userName, sessionId).catch(console.warn);
      }
    };
  }, [ciId, userName, sessionId]);

  // Release lock on tab close (best effort)
  useEffect(() => {
    const handleUnload = () => {
      if (!lockOwnedRef.current) return;
      const body = JSON.stringify({ user_name: userName, session_id: sessionId });
      navigator.sendBeacon(
        `/api/cis/${encodeURIComponent(ciId)}/unlock`,
        new Blob([body], { type: "application/json" })
      );
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [ciId, userName, sessionId]);

  const persist = useCallback(async (fms) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await api.saveFailureModes(ciId, sessionId, fms);
      setFailureModes(updated.failure_modes || []);
      setCi(updated);
      setLastSaved(new Date());
    } catch (err) {
      setSaveError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }, [ciId, sessionId]);

  const handleAdd = () => { setEditingFM(null); setModalOpen(true); };
  const handleEdit = (fm) => { setEditingFM(fm); setModalOpen(true); };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this failure mode?")) return;
    await persist(failureModes.filter((f) => f.id !== id));
  };

  const handleModalSave = async (fm) => {
    setModalOpen(false);
    const updated = editingFM
      ? failureModes.map((f) => (f.id === editingFM.id ? { ...fm, id: editingFM.id } : f))
      : [...failureModes, { ...fm, id: crypto.randomUUID() }];
    await persist(updated);
  };

  const handleRetryLock = async () => {
    try {
      await api.acquireLock(ciId, userName, sessionId);
      setLockOwned(true);
      setLockInfo(null);
      setLockExpired(false);
      heartbeatRef.current = setInterval(
        () => api.sendHeartbeat(ciId, userName, sessionId).catch(console.warn),
        HEARTBEAT_MS
      );
    } catch (err) {
      if (err.status === 423) {
        setLockInfo(err.detail);
        setLockExpired(false);
        alert(`Still locked by ${err.detail?.locked_by || "another user"}.`);
      }
    }
  };

  const handleBack = async () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (lockOwnedRef.current) {
      try { await api.releaseLock(ciId, userName, sessionId); } catch (_) {}
      setLockOwned(false);
    }
    onBack();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading {ciId}…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <p className="error-text">{error}</p>
        <button className="btn btn-outline" onClick={onBack}>← Back to list</button>
      </div>
    );
  }

  return (
    <div className="ci-editor">
      {/* Lock banner */}
      {!lockOwned && lockInfo && (
        <div className={`lock-banner${lockExpired ? " lock-banner-expired" : ""}`}>
          <span>
            🔒 {lockExpired
              ? <>Lock held by <strong>{lockInfo.locked_by || lockInfo.user_name}</strong> has expired</>
              : <>Locked for editing by <strong>{lockInfo.locked_by || lockInfo.user_name}</strong></>
            }
            {lockInfo.expires_at && !lockExpired && (
              <> — <LockCountdown expiresAt={lockInfo.expires_at} onExpired={() => setLockExpired(true)} /></>
            )}
          </span>
          <span className="lock-readonly-badge">READ ONLY</span>
          <button
            className={`btn btn-sm ${lockExpired ? "btn-primary" : "btn-outline"}`}
            onClick={handleRetryLock}
          >
            {lockExpired ? "Take Edit Lock" : "Retry Edit"}
          </button>
        </div>
      )}

      {/* Editor header */}
      <div className="editor-header">
        <div>
          <h1 className="editor-ci-id">{ciId}</h1>
          <div className="editor-meta">
            {failureModes.length} failure mode{failureModes.length !== 1 ? "s" : ""}
            {" · "}Last updated {formatDateTime(ci?.updated_at)}
            {saving && <span className="saving-indicator"> · Saving…</span>}
            {!saving && lastSaved && (
              <span className="saved-indicator"> · Saved {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
          {saveError && <div className="save-error">⚠ {saveError}</div>}
        </div>
        <div className="editor-actions">
          {lockOwned && (
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              + Add Failure Mode
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => api.exportCI(ciId)}>
            Export XLSX
          </button>
          <button className="btn btn-outline" onClick={handleBack}>
            ← Exit
          </button>
        </div>
      </div>

      {/* Table or empty state */}
      {failureModes.length === 0 ? (
        <div className="empty-state">
          <p>No failure modes recorded yet.</p>
          {lockOwned && (
            <button className="btn btn-primary" onClick={handleAdd}>
              + Add First Failure Mode
            </button>
          )}
          {!lockOwned && (
            <p style={{ fontSize: 13, marginTop: 8 }}>This CI is locked by another user.</p>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="fm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Function / Feature</th>
                <th>Failure Mode</th>
                <th>Dep. Severity</th>
                <th>Effect / Service</th>
                <th>SEV</th>
                <th>OCC</th>
                <th>DET</th>
                <th>RPN</th>
                <th>Runbook</th>
                <th></th>
                {lockOwned && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {failureModes.map((fm) => (
                <tr key={fm.id} onDoubleClick={() => lockOwned && handleEdit(fm)}>
                  <td className="td-num">{fm.item_number}</td>
                  <td className="td-text" title={fm.function_feature}>{fm.function_feature || <span className="text-muted">—</span>}</td>
                  <td className="td-text" title={fm.failure_mode}>{fm.failure_mode || <span className="text-muted">—</span>}</td>
                  <td className="td-center"><DepSevBadge value={fm.dependency_severity} /></td>
                  <td className="td-text" title={fm.effect_on_service}>{fm.effect_on_service || <span className="text-muted">—</span>}</td>
                  <td className="td-center score-cell">{fm.sev || <span className="text-muted">—</span>}</td>
                  <td className="td-center score-cell">{fm.occ || <span className="text-muted">—</span>}</td>
                  <td className="td-center score-cell">{fm.det || <span className="text-muted">—</span>}</td>
                  <td className="td-center"><RpnBadge rpn={fm.rpn} /></td>
                  <td className="td-center">
                    {fm.runbook_links
                      ? <a href={fm.runbook_links} target="_blank" rel="noopener noreferrer" className="link-icon" title={fm.runbook_links}>🔗</a>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="td-center">
                    <button className="btn-json" onClick={() => setJsonFM(fm)} title="View JSON">{"{ }"}</button>
                  </td>
                  {lockOwned && (
                    <td className="td-actions">
                      <button className="btn-icon" onClick={() => handleEdit(fm)} title="Edit">✏</button>
                      <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(fm.id)} title="Delete">✕</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <FailureModeModal
          fm={editingFM}
          onSave={handleModalSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {jsonFM && (
        <div className="json-modal-overlay" onClick={() => setJsonFM(null)}>
          <div className="json-modal" onClick={(e) => e.stopPropagation()}>
            <div className="json-modal-header">
              <span>JSON — {jsonFM.failure_mode || jsonFM.id}</span>
              <button className="btn-icon" onClick={() => setJsonFM(null)} title="Close">✕</button>
            </div>
            <pre className="json-modal-body">{JSON.stringify(jsonFM, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
