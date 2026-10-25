"use client";

import { useState } from "react";
import { readDevEditor, saveDevGroup, saveDevPerson } from "@/lib/dev-editor-actions";

type Data = Awaited<ReturnType<typeof readDevEditor>>;
const field = "w-full rounded border border-gray-300 bg-white p-2 text-sm";

export function DevEditor({ initialData }: { initialData: Data }) {
  const [data, setData] = useState(initialData);
  const [groupId, setGroupId] = useState(data.groups[0]?.id ?? "");
  const [personId, setPersonId] = useState(data.people[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const group = data.groups.find((g) => g.id === groupId);
  const person = data.people.find((p) => p.id === personId);

  async function save(action: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    try {
      await action();
      setData(await readDevEditor());
      setNotice("Saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed. Reload before retrying.");
    } finally { setBusy(false); }
  }

  return (
    <main id="main" className="mx-auto max-w-3xl space-y-5 p-5" style={{ overflowY: "auto", height: "100dvh" }}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dev editor</h1>
        <a className="button-secondary" href="/">Back to app</a>
      </div>
      <p className="text-sm text-gray-600">{data.mode === "live" ? "Live database — saves apply immediately." : "Mock demo fixtures — changes last until the dev server restarts."}</p>
      <p role="status" aria-live="polite">{busy ? "Saving…" : notice}</p>
      <fieldset disabled={busy} className="space-y-5">
        <section className="panel space-y-4">
          <h2 className="font-bold">Group owner & people</h2>
          <label className="block">Group
            <select className={field} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              {data.groups.map((g) => <option key={g.id} value={g.id}>{g.title} · {g.tableId}</option>)}
            </select>
          </label>
          {group ? <form key={`${group.id}:${group.hostId}:${group.memberIds.join(",")}`} className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            void save(() => saveDevGroup({ id: group.id, hostId: String(form.get("owner")), memberIds: form.getAll("member").map(String) }, data.mode));
          }}>
            <label className="block">Owner
              <select name="owner" defaultValue={group.hostId} className={field} required>
                {data.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <fieldset className="space-y-2">
              <legend className="mb-2">People ({group.totalSeats} seats, including owner)</legend>
              <p className="text-sm text-gray-500">Owner is always included. Check everyone else who should be in this group.</p>
              {data.people.map((p) => <label key={p.id} className="flex items-center gap-2">
                <input type="checkbox" name="member" value={p.id} defaultChecked={group.memberIds.includes(p.id)} />{p.name}
              </label>)}
            </fieldset>
            <button className="button-primary" type="submit">Save group</button>
          </form> : <p>No active or scheduled groups.</p>}
        </section>
        <section className="panel space-y-4">
          <h2 className="font-bold">Edit person</h2>
          <label className="block">Person
            <select className={field} value={personId} onChange={(e) => setPersonId(e.target.value)}>
              {data.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          {person && <form key={JSON.stringify(person)} className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            void save(() => saveDevPerson({ id: person.id, name: String(form.get("name")), major: String(form.get("major")), bio: String(form.get("bio")), currentCourses: String(form.get("courses")).split(",").map((s) => s.trim()).filter(Boolean) }, data.mode));
          }}>
            <label className="block">Name<input name="name" className={field} defaultValue={person.name} required maxLength={120} /></label>
            <label className="block">Major<input name="major" className={field} defaultValue={person.major} maxLength={200} /></label>
            <label className="block">Courses (comma separated)<input name="courses" className={field} defaultValue={person.currentCourses.join(", ")} /></label>
            <label className="block">Bio<textarea name="bio" className={field} defaultValue={person.bio} maxLength={2000} /></label>
            <button className="button-primary" type="submit">Save person</button>
          </form>}
        </section>
      </fieldset>
    </main>
  );
}
