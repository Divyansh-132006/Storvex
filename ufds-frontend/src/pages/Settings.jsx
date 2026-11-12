import { useState } from "react";
import {
  User,
  Shield,
  Bell,
  SlidersHorizontal,
  HardDrive,
  Trash2,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  LogOut,
} from "lucide-react";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: SlidersHorizontal },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "storage", label: "Storage", icon: HardDrive },
];

function Settings() {
  const [activeSection, setActiveSection] = useState("profile");

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    bio: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    fileSharing: true,
    storageAlerts: true,
    securityAlerts: true,
    productUpdates: false,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [saved, setSaved] = useState(false);

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });

    setSaved(false);
  };

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    // Connect this handler to your settings API.
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const handlePasswordSave = () => {
    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      alert("Please fill all password fields.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    // Connect this handler to your password update API.
    alert("Connect password update API here.");

    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (confirmed) {
      // Connect account deletion API here.
      alert("Connect account deletion API here.");
    }
  };

  const Toggle = ({ enabled, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={enabled}
      className={`relative h-6 w-11 rounded-full transition-all ${
        enabled ? "bg-[#B7F542]" : "bg-[#333333]"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full transition-all ${
          enabled
            ? "left-6 bg-black"
            : "left-1 bg-white"
        }`}
      />
    </button>
  );

  const InputField = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    type = "text",
  }) => (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="text-sm font-medium text-[#D4D4D4]"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#555555] focus:border-[#B7F542]"
      />
    </div>
  );

  const SectionHeader = ({ title, description }) => (
    <div className="mb-7">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#777777]">
        {description}
      </p>
    </div>
  );

  const NotificationItem = ({
    title,
    description,
    settingKey,
  }) => (
    <div className="flex items-center justify-between gap-4 border-b border-[#262626] py-5 last:border-0">
      <div>
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <p className="mt-1 text-xs leading-5 text-[#777777]">
          {description}
        </p>
      </div>

      <Toggle
        enabled={notifications[settingKey]}
        onChange={() => toggleNotification(settingKey)}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[#777777]">
            <span>Storvex</span>
            <ChevronRight size={14} />
            <span className="text-[#B7F542]">Settings</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Settings
          </h1>

          <p className="mt-2 text-sm text-[#777777]">
            Manage your profile, account preferences, and security.
          </p>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr]">
          {/* Sidebar */}
          <aside className="h-fit rounded-2xl border border-[#262626] bg-[#111111] p-3">
            <p className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[2px] text-[#555555]">
              General
            </p>

            <div className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                      isActive
                        ? "bg-[#B7F542]/10 text-[#B7F542]"
                        : "text-[#888888] hover:bg-[#1A1A1A] hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{section.label}</span>

                    {isActive && (
                      <ChevronRight
                        size={16}
                        className="ml-auto"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="my-4 border-t border-[#262626]" />

            <button
              onClick={() => alert("Connect logout API here.")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#888888] transition hover:bg-[#1A1A1A] hover:text-red-400"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 rounded-2xl border border-[#262626] bg-[#111111] p-5 sm:p-8">
            {/* PROFILE */}
            {activeSection === "profile" && (
              <>
                <SectionHeader
                  title="Profile Settings"
                  description="Update your personal information and profile details."
                />

                {/* Avatar */}
                <div className="mb-8 flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#333333] bg-[#1A1A1A]">
                    <User size={30} className="text-[#777777]" />
                  </div>

                  <div>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg border border-[#333333] bg-[#1A1A1A] px-4 py-2 text-sm text-white transition hover:border-[#B7F542] hover:text-[#B7F542]"
                    >
                      <Camera size={15} />
                      Upload Photo
                    </button>

                    <p className="mt-2 text-xs text-[#555555]">
                      JPG, PNG or WEBP. Max 5MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <InputField
                    label="Full Name"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                  />

                  <InputField
                    label="Email Address"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email address"
                    type="email"
                  />
                </div>

                <div className="mt-5 space-y-2">
                  <label
                    htmlFor="bio"
                    className="text-sm font-medium text-[#D4D4D4]"
                  >
                    Bio
                  </label>

                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={profile.bio}
                    onChange={handleProfileChange}
                    placeholder="Write something about yourself..."
                    className="w-full resize-none rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#555555] focus:border-[#B7F542]"
                  />
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 rounded-xl bg-[#B7F542] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#A5E632]"
                  >
                    {saved && <Check size={16} />}
                    {saved ? "Saved" : "Save Changes"}
                  </button>
                </div>
              </>
            )}

            {/* ACCOUNT */}
            {activeSection === "account" && (
              <>
                <SectionHeader
                  title="Account Settings"
                  description="Manage your account information and preferences."
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#0A0A0A] p-5">
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Account Type
                      </h3>
                      <p className="mt-1 text-xs text-[#777777]">
                        Your current subscription plan.
                      </p>
                    </div>

                    <span className="rounded-lg border border-[#333333] px-3 py-1.5 text-xs text-[#888888]">
                      Not available
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#0A0A0A] p-5">
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Language
                      </h3>
                      <p className="mt-1 text-xs text-[#777777]">
                        Choose your preferred language.
                      </p>
                    </div>

                    <select
                      className="rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-sm text-white outline-none focus:border-[#B7F542]"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#0A0A0A] p-5">
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Theme
                      </h3>
                      <p className="mt-1 text-xs text-[#777777]">
                        Customize the appearance of Storvex.
                      </p>
                    </div>

                    <div className="flex rounded-lg border border-[#262626] bg-[#141414] p-1">
                      {["dark", "light", "system"].map((value) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value)}
                          className={`rounded-md px-3 py-2 text-xs capitalize transition ${
                            theme === value
                              ? "bg-[#B7F542] font-semibold text-black"
                              : "text-[#777777] hover:text-white"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="rounded-xl bg-[#B7F542] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#A5E632]"
                  >
                    {saved ? "Saved" : "Save Changes"}
                  </button>
                </div>
              </>
            )}

            {/* SECURITY */}
            {activeSection === "security" && (
              <>
                <SectionHeader
                  title="Security"
                  description="Keep your account secure by managing your password and authentication."
                />

                <div className="mb-8 rounded-xl border border-[#262626] bg-[#0A0A0A] p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#1A1A1A] p-3">
                      <Lock size={20} className="text-[#B7F542]" />
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Change Password
                      </h3>
                      <p className="mt-1 text-xs text-[#777777]">
                        Update your password regularly.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    {[
                      {
                        label: "Current Password",
                        name: "currentPassword",
                      },
                      {
                        label: "New Password",
                        name: "newPassword",
                      },
                      {
                        label: "Confirm New Password",
                        name: "confirmPassword",
                      },
                    ].map((field) => (
                      <div key={field.name} className="space-y-2">
                        <label className="text-sm text-[#D4D4D4]">
                          {field.label}
                        </label>

                        <div className="relative">
                          <input
                            name={field.name}
                            value={passwords[field.name]}
                            onChange={handlePasswordChange}
                            type={showPasswords ? "text" : "password"}
                            placeholder="••••••••••••"
                            className="w-full rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 pr-12 text-sm text-white outline-none focus:border-[#B7F542]"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords(!showPasswords)
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white"
                          >
                            {showPasswords ? (
                              <EyeOff size={17} />
                            ) : (
                              <Eye size={17} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handlePasswordSave}
                      className="rounded-xl bg-[#B7F542] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#A5E632]"
                    >
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#262626] bg-[#0A0A0A] p-5">
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Two-Factor Authentication
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#777777]">
                      Add an extra layer of security to your account.
                    </p>
                  </div>

                  <Toggle
                    enabled={twoFactorEnabled}
                    onChange={() =>
                      setTwoFactorEnabled(!twoFactorEnabled)
                    }
                  />
                </div>
              </>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <>
                <SectionHeader
                  title="Notifications"
                  description="Choose which notifications you want to receive."
                />

                <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] px-5">
                  <NotificationItem
                    title="Email Notifications"
                    description="Receive important updates through email."
                    settingKey="emailNotifications"
                  />

                  <NotificationItem
                    title="File Sharing"
                    description="Get notified when someone shares a file with you."
                    settingKey="fileSharing"
                  />

                  <NotificationItem
                    title="Storage Alerts"
                    description="Receive alerts when your storage is running low."
                    settingKey="storageAlerts"
                  />

                  <NotificationItem
                    title="Security Alerts"
                    description="Get notified about account security activity."
                    settingKey="securityAlerts"
                  />

                  <NotificationItem
                    title="Product Updates"
                    description="Receive information about new features."
                    settingKey="productUpdates"
                  />
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="rounded-xl bg-[#B7F542] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#A5E632]"
                  >
                    {saved ? "Saved" : "Save Preferences"}
                  </button>
                </div>
              </>
            )}

            {/* STORAGE */}
            {activeSection === "storage" && (
              <>
                <SectionHeader
                  title="Storage"
                  description="Manage your cloud storage and storage preferences."
                />

                <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#1A1A1A] p-3">
                      <HardDrive
                        size={22}
                        className="text-[#B7F542]"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Storage Overview
                      </h3>
                      <p className="mt-1 text-xs text-[#777777]">
                        Storage usage will be displayed once your account
                        data is connected.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#262626]">
                    <div className="h-full w-0 rounded-full bg-[#B7F542]" />
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-[#777777]">
                    <span>Usage unavailable</span>
                    <span>Quota unavailable</span>
                  </div>
                </div>
              </>
            )}

            {/* DANGER ZONE */}
            <div className="mt-10 border-t border-[#262626] pt-8">
              <div className="mb-5 flex items-center gap-2">
                <Trash2 size={18} className="text-red-400" />
                <h2 className="text-lg font-semibold text-red-400">
                  Danger Zone
                </h2>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">
                    Delete Account
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[#777777]">
                    Permanently delete your account and associated data.
                  </p>
                </div>

                <button
                  onClick={handleDeleteAccount}
                  className="shrink-0 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Settings;