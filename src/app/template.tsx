// A per-navigation wrapper so each route fades/rises in on transition.
// (Next re-mounts template.tsx on every navigation.)
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
