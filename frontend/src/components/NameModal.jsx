import { useState } from "react";

export default function NameModal({ onSubmit }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="name-modal-page">
      <div className="name-modal-card">
        <div className="name-modal-logo">
          <div className="name-modal-bullseye" />
        </div>
        <h1>Impact Analysis</h1>
        <p>Dependency Risk Assessment Tool</p>
        <form className="name-modal-form" onSubmit={handleSubmit}>
          <label htmlFor="ia-name">Your Name</label>
          <input
            id="ia-name"
            type="text"
            placeholder="e.g. Jane Smith"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            autoFocus
            autoComplete="name"
          />
          {error && <div className="name-modal-error">{error}</div>}
          <button type="submit" className="btn btn-primary">
            Continue →
          </button>
        </form>
      </div>
    </div>
  );
}
