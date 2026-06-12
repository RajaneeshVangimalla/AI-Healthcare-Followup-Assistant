import { NavLink } from "react-router-dom";

function Navbar() {
  const linkClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-bold transition ${
      isActive
        ? "bg-teal-50 text-teal-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-700 text-sm font-black text-white">
            HA
          </span>
          <span>
            <span className="block text-sm font-extrabold uppercase tracking-wide text-teal-700">
              HealthAI
            </span>
            <span className="block text-xs font-semibold text-slate-500">
              Follow-up Assistant
            </span>
          </span>
        </NavLink>

        <div className="flex flex-wrap items-center gap-1">
          <NavLink to="/" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/patients" className={linkClass}>
            Patients
          </NavLink>
          <NavLink to="/followups" className={linkClass}>
            Follow-ups
          </NavLink>
          <NavLink to="/upload" className={linkClass}>
            Upload
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
