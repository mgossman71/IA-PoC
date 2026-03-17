import { useState, useEffect } from "react";
import NameModal from "./components/NameModal";
import CIList from "./components/CIList";
import CIEditor from "./components/CIEditor";

/** Read CI id from current URL path, e.g. /ci/my-payments-api → "my-payments-api" */
function ciFromPath() {
  const m = window.location.pathname.match(/^\/ci\/(.+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

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

  // Initialise from URL so a page refresh lands on the right view
  const [currentCI, setCurrentCI] = useState(() => ciFromPath());

  // Sync browser back/forward buttons → React state
  useEffect(() => {
    const onPop = () => setCurrentCI(ciFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigateToCI = (ciId) => {
    history.pushState({ ciId }, "", `/ci/${encodeURIComponent(ciId)}`);
    setCurrentCI(ciId);
  };

  const navigateToList = () => {
    history.pushState(null, "", "/");
    setCurrentCI(null);
  };

  const handleSetName = (name) => {
    sessionStorage.setItem("ia_user_name", name);
    setUserName(name);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ia_user_name");
    sessionStorage.removeItem("ia_session_id");
    navigateToList();
    setUserName("");
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
                onClick={navigateToList}
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
            onBack={navigateToList}
          />
        ) : (
          <CIList
            userName={userName}
            sessionId={sessionId}
            onOpenCI={navigateToCI}
          />
        )}
      </main>
    </div>
  );
}

export default App;
