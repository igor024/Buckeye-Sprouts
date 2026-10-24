"use client";

import { useState, type FormEvent } from "react";
import { GraduationCap, ShieldCheck, UserRound } from "lucide-react";
import type { ProfilePreview } from "@/types/contracts";
import { updateDemoProfileAction } from "../actions";

export function ProfileCard({ profile: initialProfile }: { profile: ProfilePreview | null }) {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [major, setMajor] = useState(initialProfile?.major ?? "");
  const [courses, setCourses] = useState(initialProfile?.currentCourses.join(", ") ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [simulated, setSimulated] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateDemoProfileAction({
        name, major, bio, avatarUrl: profile.avatarUrl,
        currentCourses: courses.split(",").map((course) => course.trim()).filter(Boolean),
      });
      setProfile(updated);
      setEditing(false);
      setMessage("Demo profile saved for this server process.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your profile.");
    } finally { setBusy(false); }
  }

  return (
    <section className="panel" aria-labelledby="profile-title">
      <div className="panel-heading"><UserRound size={18} /><h2 id="profile-title">Your study profile</h2></div>
      {profile ? <>
        <div className="flex items-center gap-3 mt-5">
          <div className="avatar" aria-hidden="true">{profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
          <div><h3 className="font-semibold">{profile.name}</h3><p className="text-xs text-stone-500 mt-1">Synthetic demo profile</p></div>
        </div>
        <p className="flex gap-2 text-sm mt-5 text-stone-600"><GraduationCap size={17} className="shrink-0" />{profile.major || "Major not added"}</p>
        <p className="text-sm text-stone-500 leading-6 mt-3">{profile.bio || "Add a short introduction for your study group."}</p>
        <div className="flex flex-wrap gap-2 mt-4">{profile.currentCourses.map((course) => <span className="tag" key={course}>{course}</span>)}</div>
        <div className="notice mt-5"><ShieldCheck size={17} className="shrink-0" /><p>{simulated ? "Simulated ID check complete for this demo view. This is not Ohio State verification." : "Identity unverified. Hosts review your profile before sharing a table location."}</p></div>
        <button type="button" className="button-secondary w-full mt-3" onClick={() => setSimulated(true)} disabled={simulated}>Simulate ID check · Test mode</button>
        <button type="button" className="button-secondary w-full mt-3" onClick={() => { setEditing(!editing); setError(""); }} aria-expanded={editing}>{editing ? "Cancel editing" : "Edit demo profile"}</button>
        {editing && <form className="grid gap-3 mt-4" onSubmit={save}>
          <label className="grid gap-1 text-xs font-semibold" htmlFor="profile-name">Name<input id="profile-name" className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required /></label>
          <label className="grid gap-1 text-xs font-semibold" htmlFor="profile-major">Major<input id="profile-major" className="input" value={major} onChange={(event) => setMajor(event.target.value)} maxLength={120} /></label>
          <label className="grid gap-1 text-xs font-semibold" htmlFor="profile-courses">Courses, separated by commas<input id="profile-courses" className="input" value={courses} onChange={(event) => setCourses(event.target.value)} /></label>
          <label className="grid gap-1 text-xs font-semibold" htmlFor="profile-bio">Bio<textarea id="profile-bio" className="input" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} rows={3} /></label>
          <button className="button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save demo profile"}</button>
        </form>}
      </> : <p className="muted mt-4">No authenticated profile is available. Sign-in integration is pending.</p>}
      {error && <p className="text-sm text-red-800 mt-3" role="alert">{error}</p>}
      {message && <p className="text-sm text-green-800 mt-3" role="status">{message}</p>}
    </section>
  );
}
