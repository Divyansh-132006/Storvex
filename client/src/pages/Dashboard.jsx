import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

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
      </section>
    </main>
  );
}
