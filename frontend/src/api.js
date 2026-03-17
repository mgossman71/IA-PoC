const BASE = "/api";

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    const msg = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    const err = new Error(msg);
    err.status = res.status;
    err.detail = body.detail;
    throw err;
  }
  return res.json();
}

export const listCIs = () => req("/cis");

export const createCI = (ci_id) =>
  req("/cis", { method: "POST", body: JSON.stringify({ ci_id }) });

export const getCI = (ci_id) =>
  req(`/cis/${encodeURIComponent(ci_id)}`);

export const acquireLock = (ci_id, user_name, session_id) =>
  req(`/cis/${encodeURIComponent(ci_id)}/lock`, {
    method: "POST",
    body: JSON.stringify({ user_name, session_id }),
  });

export const releaseLock = (ci_id, user_name, session_id) =>
  req(`/cis/${encodeURIComponent(ci_id)}/unlock`, {
    method: "POST",
    body: JSON.stringify({ user_name, session_id }),
  });

export const sendHeartbeat = (ci_id, user_name, session_id) =>
  req(`/cis/${encodeURIComponent(ci_id)}/heartbeat`, {
    method: "POST",
    body: JSON.stringify({ user_name, session_id }),
  });

export const saveFailureModes = (ci_id, session_id, failure_modes) =>
  req(`/cis/${encodeURIComponent(ci_id)}/failure-modes`, {
    method: "PUT",
    body: JSON.stringify({ session_id, failure_modes }),
  });

export const exportCI = (ci_id) => {
  window.location.href = `${BASE}/cis/${encodeURIComponent(ci_id)}/export`;
};
