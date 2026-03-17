import { useState } from "react";
import NameModal from "./components/NameModal";
import CIList from "./components/CIList";
import CIEditor from "./components/CIEditor";

function App() {
  const [userName, setUserName] = useState(
    () => sessionStorage.getItem("ia_user_name") || ""
  );
  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem("ia_session_id");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("ia_session_id", id);
    }
    return id;
  });
  const [currentCI, setCurrentCI] = useState(null);

  const handleSetName = (name) => {
    sessionStorage.setItem("ia_user_name", name);
    setUserName(name);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ia_user_name");
    sessionStorage.removeItem("ia_session_id");
    setUserName("");
    setCurrentCI(null);
  };

  if (!userName) {
    return <NameModal onSubmit={handleSetName} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="bullseye" aria-hidden="true" />
            <div>
              <div className="header-title">Impact Analysis</div>
              <div className="header-subtitle">Dependency Risk Assessment</div>
            </div>
          </div>
          <div className="header-right">
            {currentCI && (
              <button
                className="btn-link-white"
                onClick={() => setCurrentCI(null)}
              >
                ← All CIs
              </button>
            )}
            <div className="header-user">
              <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
              <span>{userName}</span>
              <button className="btn-link-white" onClick={handleLogout} title="Sign out">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {currentCI ? (
          <CIEditor
            ciId={currentCI}
            userName={userName}
            sessionId={sessionId}
            onBack={() => setCurrentCI(null)}
          />
        ) : (
          <CIList
            userName={userName}
            sessionId={sessionId}
            onOpenCI={setCurrentCI}
          />
        )}
      </main>
    </div>
  );
}

export default App;
