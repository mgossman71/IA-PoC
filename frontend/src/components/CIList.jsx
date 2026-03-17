import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "../api";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

function LockBadge({ lock }) {
  if (!lock) {
    return <span className="badge-available">● Available</span>;
  }
  const exp = new Date(lock.expires_at);
  return (
    <span className="badge-locked" title={`Expires ${exp.toLocaleTimeString()}`}>
      🔒 {lock.user_name}
    </span>
  );
}

export default function CIList({ onOpenCI }) {
  const [cis, setCis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCIId, setNewCIId] = useState("");
  const newInputRef = useRef(null);

  const fetchCIs = useCallback(async () => {
    try {
      const data = await api.listCIs();
      setCis(data);
    } catch (e) {
      console.error("Failed to load CIs", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCIs();
    const interval = setInterval(fetchCIs, 30_000);
    return () => clearInterval(interval);
  }, [fetchCIs]);

  useEffect(() => {
    if (showNewForm) newInputRef.current?.focus();
  }, [showNewForm]);

  const handleCreate = async (ciId) => {
    const trimmed = ciId.trim();
    if (!trimmed) return;
    setCreating(true);
    setCreateError("");
    try {
      await api.createCI(trimmed);
      onOpenCI(trimmed);
    } catch (e) {
      setCreateError(e.message || "Failed to create CI");
      setCreating(false);
    }
  };

  const filtered = cis.filter((c) =>
    c.ci_id.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = cis.some(
    (c) => c.ci_id.toLowerCase() === search.trim().toLowerCase()
  );

  const showSearchCreatePrompt = search.trim() && !exactMatch;

  return (
    <div>
      <div className="ci-list-header">
        <div>
          <h2>Configuration Items</h2>
          <p>Search for your CI to continue, or create a new one.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="refresh-btn" onClick={fetchCIs} title="Refresh list">
            ↺ Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setShowNewForm(true); setCreateError(""); setNewCIId(""); }}
          >
            + New CI
          </button>
        </div>
      </div>

      {/* New CI form */}
      {showNewForm && (
        <div className="ci-new-form card" style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="new-ci-id">CI Identifier</label>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
              Letters, numbers, hyphens, underscores, and dots only (e.g. <code>my-payments-api</code>)
            </p>
            <input
              id="new-ci-id"
              ref={newInputRef}
              type="text"
              placeholder="e.g. my-payments-api"
              value={newCIId}
              onChange={(e) => { setNewCIId(e.target.value); setCreateError(""); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate(newCIId);
                if (e.key === "Escape") setShowNewForm(false);
              }}
            />
            {createError && (
              <div style={{ color: "#c62828", fontSize: 12, marginTop: 6 }}>{createError}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() => handleCreate(newCIId)}
              disabled={creating || !newCIId.trim()}
            >
              {creating ? "Creating…" : "Create CI"}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setShowNewForm(false)}
              disabled={creating}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="search-bar-row">
        <input
          type="text"
          placeholder="Search CIs…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
          autoFocus={!showNewForm}
        />
      </div>

      {showSearchCreatePrompt && (
        <div className="ci-create-inline">
          <span>No CI found for <strong>"{search.trim()}"</strong></span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleCreate(search.trim())}
            disabled={creating}
          >
            {creating ? "Creating…" : `+ Create "${search.trim()}"`}
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading CIs…</p>
        </div>
      ) : filtered.length === 0 && !showSearchCreatePrompt ? (
        <div className="empty-cis">
          <p>{search ? `No CIs match "${search}".` : "No configuration items yet."}</p>
          <p style={{ fontSize: 13 }}>Use the <strong>+ New CI</strong> button above to get started.</p>
        </div>
      ) : (
        <div className="ci-grid">
          {filtered.map((ci) => (
            <div
              key={ci.ci_id}
              className="ci-card"
              onClick={() => onOpenCI(ci.ci_id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onOpenCI(ci.ci_id)}
            >
              <div className="ci-card-header">
                <div className="ci-card-id">{ci.ci_id}</div>
                <LockBadge lock={ci.lock} />
              </div>
              <div className="ci-card-meta">
                <span>Created {formatDate(ci.created_at)}</span>
                <span>Updated {formatDate(ci.updated_at)}</span>
              </div>
              <div className="ci-card-footer">
                <span className="fm-count-badge">
                  {ci.failure_mode_count} failure mode{ci.failure_mode_count !== 1 ? "s" : ""}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => { e.stopPropagation(); onOpenCI(ci.ci_id); }}
                >
                  Open →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
