import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="dashboard">
      <section className="profile-card">
        {user.avatar ? (
          <img className="avatar" src={user.avatar} alt="" />
        ) : (
          <div className="avatar-placeholder">{user.name?.charAt(0).toUpperCase()}</div>
        )}
        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <button className="button secondary" type="button" onClick={logout}>Logout</button>
      </section>
      <section className="files-placeholder">
        <h2>Your files will appear here</h2>
        <p>File upload and storage will be added later.</p>
      </section>
    </main>
  );
}
