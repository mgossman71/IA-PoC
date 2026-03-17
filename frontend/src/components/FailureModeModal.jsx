import { useState, useEffect } from "react";
import { SEV_OPTIONS, OCC_OPTIONS, DET_OPTIONS, DEP_SEVERITY_OPTIONS } from "../constants";

const EMPTY = {
  function_feature: "",
  failure_mode: "",
  dependency_severity: "",
  effect_on_service: "",
  effect_on_guest: "",
  effect_on_worker: "",
  sev: "",
  occ: "",
  det: "",
  runbook_links: "",
};

function calcRpn(sev, occ, det) {
  const s = parseInt(sev) || 0;
  const o = parseInt(occ) || 0;
  const d = parseInt(det) || 0;
  return s * o * d;
}

function RpnValue({ value }) {
  if (!value) return <span className="rpn-display-value text-muted">—</span>;
  const cls = value < 50 ? "rpn-low" : value < 150 ? "rpn-medium" : "rpn-high";
  return <span className={`rpn-display-value rpn-badge ${cls}`}>{value}</span>;
}

export default function FailureModeModal({ fm, onSave, onClose }) {
  const [form, setForm] = useState(fm ? { ...fm } : { ...EMPTY });

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const rpn = calcRpn(form.sev, form.occ, form.det);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      sev: form.sev ? parseInt(form.sev) : null,
      occ: form.occ ? parseInt(form.occ) : null,
      det: form.det ? parseInt(form.det) : null,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal-panel" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>{fm ? "Edit Failure Mode" : "Add Failure Mode"}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
            <div className="modal-form-grid">

              <div className="form-field full-width">
                <label htmlFor="ff">Function / Feature of my service</label>
                <input
                  id="ff"
                  type="text"
                  value={form.function_feature}
                  onChange={set("function_feature")}
                  placeholder="e.g. Look up data center location"
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="fm">Failure Mode of Upstream Dependency</label>
                <input
                  id="fm"
                  type="text"
                  value={form.failure_mode}
                  onChange={set("failure_mode")}
                  placeholder="e.g. Locations API failing"
                />
              </div>

              <div className="form-field">
                <label htmlFor="ds">Upstream Dependency Severity</label>
                <select id="ds" value={form.dependency_severity} onChange={set("dependency_severity")}>
                  <option value="">— Select —</option>
                  {DEP_SEVERITY_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="rl">Related Runbook(s) Link</label>
                <input
                  id="rl"
                  type="url"
                  value={form.runbook_links}
                  onChange={set("runbook_links")}
                  placeholder="https://..."
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="es">Effect on my service</label>
                <textarea
                  id="es"
                  value={form.effect_on_service}
                  onChange={set("effect_on_service")}
                  placeholder="Describe impact on your service…"
                />
              </div>

              <div className="form-field">
                <label htmlFor="eg">Effect on Guest</label>
                <textarea
                  id="eg"
                  value={form.effect_on_guest}
                  onChange={set("effect_on_guest")}
                  placeholder="Customer-facing impact…"
                  style={{ minHeight: 60 }}
                />
              </div>

              <div className="form-field">
                <label htmlFor="ew">Effect on Worker</label>
                <textarea
                  id="ew"
                  value={form.effect_on_worker}
                  onChange={set("effect_on_worker")}
                  placeholder="Impact on team members…"
                  style={{ minHeight: 60 }}
                />
              </div>

              <div className="form-field">
                <label htmlFor="sev">Severity (SEV)</label>
                <select id="sev" value={form.sev} onChange={set("sev")}>
                  <option value="">— Select —</option>
                  {SEV_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="occ">Occurrence (OCC)</label>
                <select id="occ" value={form.occ} onChange={set("occ")}>
                  <option value="">— Select —</option>
                  {OCC_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="det">Detection (DET)</label>
                <select id="det" value={form.det} onChange={set("det")}>
                  <option value="">— Select —</option>
                  {DET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Risk Priority Number (RPN)</label>
                <div className="rpn-display">
                  <span className="rpn-display-label">SEV × OCC × DET</span>
                  <RpnValue value={rpn} />
                </div>
              </div>

            </div>
          </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {fm ? "Save Changes" : "Add Failure Mode"}
          </button>
        </div>
      </form>
    </div>
  );
}
