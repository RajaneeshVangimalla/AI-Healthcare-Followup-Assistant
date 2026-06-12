import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge, { RiskBadge } from "../components/Badge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { getFollowUps } from "../services/api";
import { riskLevel, safeText } from "../utils/healthMetrics";

function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    getFollowUps()
      .then((response) => {
        if (!ignore) {
          setFollowUps(response.data || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Unable to load follow-ups.");
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

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-wide text-teal-700">
          Care Queue
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
          Follow-ups
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Prioritized follow-up worklist synchronized from patient records and
          AI-generated briefings.
        </p>
      </header>

      {error && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Active Follow-up Queue
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {followUps.length} follow-up records
          </p>
        </div>

        {loading ? (
          <div className="p-4">
            <LoadingSkeleton rows={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Disease</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Follow-up Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followUps.map((followUp) => {
                  const level = riskLevel(followUp);

                  return (
                    <tr key={followUp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        {followUp.patientId ? (
                          <Link
                            to={`/patients/${followUp.patientId}`}
                            className="font-semibold text-teal-700 hover:text-teal-900"
                          >
                            {safeText(followUp.patientName)}
                          </Link>
                        ) : (
                          <p className="font-semibold text-slate-950">
                            {safeText(followUp.patientName)}
                          </p>
                        )}
                        <p className="text-xs text-slate-500">
                          {safeText(followUp.patientId)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {safeText(followUp.phoneNumber)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {safeText(followUp.disease)}
                      </td>
                      <td className="px-4 py-4">
                        <RiskBadge level={level} />
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {safeText(followUp.followUpDate)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={followUp.status === "COMPLETED" ? "green" : "amber"}>
                          {safeText(followUp.status, "Pending")}
                        </Badge>
                      </td>
                      <td className="max-w-xs px-4 py-4 text-slate-700">
                        {safeText(followUp.receptionistNotes)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!followUps.length && (
              <p className="p-6 text-sm text-slate-500">
                No follow-ups are available yet.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default FollowUps;
