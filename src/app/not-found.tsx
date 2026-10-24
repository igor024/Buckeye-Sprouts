import Link from "next/link";

export default function NotFound() {
  return <main id="main" className="site-width py-24 text-center"><p className="eyebrow">SESSION NOT FOUND</p><h1 className="text-3xl font-semibold mt-4">This study spot isn&apos;t here.</h1><p className="muted mt-3">Head back to find another group.</p><Link className="button-primary mt-6 inline-flex" href="/">Back to discovery</Link></main>;
}
