import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { getPatients } from "../services/api";
import { safeText, uniqueDiseases } from "../utils/healthMetrics";

const PAGE_SIZE = 8;

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [disease, setDisease] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let ignore = false;

    getPatients()
      .then((response) => {
        if (!ignore) {
          setPatients(response.data || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Unable to load patients.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const diseases = useMemo(() => uniqueDiseases(patients), [patients]);

  const filteredPatients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return patients
      .filter((patient) => {
        const matchesSearch = [
          patient.patientName,
          patient.phoneNumber,
          patient.patientId,
          patient.disease,
          patient.treatmentStatus,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

        const matchesDisease = disease === "ALL" || patient.disease === disease;
        return matchesSearch && matchesDisease;
      })
      .sort((a, b) =>
        safeText(a.followupDate, "9999-12-31").localeCompare(
          safeText(b.followupDate, "9999-12-31")
        )
      );
  }, [patients, search, disease]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const pagePatients = filteredPatients.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-wide text-teal-700">
          Patient Registry
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
          Patients
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Search, filter, and sort patient records by follow-up date.
        </p>
      </header>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.4fr_1fr]">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Search
          <input
            className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            type="search"
            placeholder="Name, phone, ID, disease"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Disease
          <select
            className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            value={disease}
            onChange={(event) => {
              setDisease(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All diseases</option>
            {diseases.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Patient List
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredPatients.length} records sorted by follow-up date
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
              disabled={page === totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-4">
            <LoadingSkeleton rows={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Disease</th>
                  <th className="px-4 py-3">Follow-up Date</th>
                  <th className="px-4 py-3">Treatment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagePatients.map((patient) => (
                    <tr key={patient.patientId} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <Link
                          to={`/patients/${patient.patientId}`}
                          className="font-semibold text-teal-700 hover:text-teal-900"
                        >
                          {safeText(patient.patientName)}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {safeText(patient.patientId)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {safeText(patient.phoneNumber)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {safeText(patient.disease)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {safeText(patient.followupDate)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {safeText(patient.treatmentStatus)}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>

            {!pagePatients.length && (
              <p className="p-6 text-sm text-slate-500">
                No patients match the selected filters.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default PatientList;
