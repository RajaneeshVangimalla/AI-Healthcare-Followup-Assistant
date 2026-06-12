import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge, { RiskBadge } from "../components/Badge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import StatCard from "../components/StatCard";
import Toast from "../components/Toast";
import {
  generatePatientAnalysis,
  getFollowUps,
  getPatient,
  getPatientMessages,
  getPatients,
} from "../services/api";
import { riskLevel, safeText, todayIsoDate } from "../utils/healthMetrics";

function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [showAllDates, setShowAllDates] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [generatingSummaryId, setGeneratingSummaryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getPatients(), getFollowUps()])
      .then(([patientResponse, followUpResponse]) => {
        if (!ignore) {
          setPatients(patientResponse.data || []);
          setFollowUps(followUpResponse.data || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Unable to load dashboard metrics from the backend.");
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

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const metrics = useMemo(() => {
    const today = todayIsoDate();
    const highRiskPatients = patients.filter(
      (patient) => riskLevel(patient) === "HIGH"
    );
    const dueToday = followUps.filter(
      (followUp) => followUp.followUpDate === today && followUp.status !== "COMPLETED"
    );
    const generatedSummaries = followUps.filter((followUp) =>
      safeText(followUp.receptionistNotes, "")
        .toLowerCase()
        .includes("ai")
    );

    return {
      totalPatients: patients.length,
      highRiskPatients: highRiskPatients.length,
      dueToday: dueToday.length,
      generatedSummaries: generatedSummaries.length,
    };
  }, [patients, followUps]);

  const recentActivity = useMemo(() => {
    return followUps.slice(0, 6).map((followUp) => ({
      id: followUp.id,
      patientName: safeText(followUp.patientName, "Unknown patient"),
      detail: `${safeText(followUp.disease)} follow-up scheduled for ${safeText(
        followUp.followUpDate,
        "no date"
      )}`,
      risk: riskLevel(followUp),
      status: safeText(followUp.status, "Pending"),
    }));
  }, [followUps]);

  const availableFollowUpDates = useMemo(() => {
    return Array.from(
      new Set(
        followUps
          .map((followUp) => followUp.followUpDate)
          .filter((date) => typeof date === "string" && date.trim())
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [followUps]);

  const filteredFollowUps = useMemo(() => {
    if (showAllDates) {
      return followUps;
    }

    return followUps.filter(
      (followUp) => followUp.followUpDate === selectedDate
    );
  }, [followUps, selectedDate, showAllDates]);

  const aiReadyCount = useMemo(() => {
    return filteredFollowUps.filter((followUp) => followUp.patientId).length;
  }, [filteredFollowUps]);

  const generateSummary = async (followUp) => {
    if (!followUp.patientId) {
      setToast({
        type: "error",
        message: "Patient ID is missing for this follow-up.",
      });
      return;
    }

    setGeneratingSummaryId(followUp.patientId);

    try {
      const [patientResponse, messageResponse] = await Promise.all([
        getPatient(followUp.patientId),
        getPatientMessages(followUp.patientId),
      ]);

      const response = await generatePatientAnalysis(followUp.patientId, {
        patientDetails: patientResponse.data,
        whatsappMessages: messageResponse.data || [],
      });

      setSummaries((current) => ({
        ...current,
        [followUp.patientId]: response.data,
      }));
      setToast({ type: "success", message: "AI summary generated." });
    } catch (err) {
      setToast({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Unable to generate AI summary for this follow-up.",
      });
    } finally {
      setGeneratingSummaryId("");
    }
  };

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-teal-700">
            Clinic Operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            Healthcare Follow-up Dashboard
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Monitor patient risk, daily call workload, and AI-assisted follow-up
            readiness from one operational view.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800"
        >
          Upload Excel Data
        </Link>
      </header>

      {error && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </section>
      )}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Patients"
              value={metrics.totalPatients}
              detail="Active records in the clinic database"
            />
            <StatCard
              title="High Risk Patients"
              value={metrics.highRiskPatients}
              detail="Based on disease, notes, urgency, and date"
              tone="red"
            />
            <StatCard
              title="Follow-ups Due Today"
              value={metrics.dueToday}
              detail={todayIsoDate()}
              tone="amber"
            />
            <StatCard
              title="AI Generated Summaries"
              value={metrics.generatedSummaries}
              detail="Follow-up records with AI context"
              tone="blue"
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-teal-700">
                  AI Follow-up Workspace
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  Generate summaries by follow-up date
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Filter the daily call list, then generate patient briefs and
                  WhatsApp-ready follow-up messages from stored records.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[auto_auto] sm:items-end">
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Follow-up Date
                  <input
                    type="date"
                    className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
                    value={selectedDate}
                    disabled={showAllDates}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  />
                </label>
                <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={showAllDates}
                    onChange={(event) => setShowAllDates(event.target.checked)}
                  />
                  All dates
                </label>
              </div>
            </div>

            <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Matching Follow-ups
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {filteredFollowUps.length}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  AI Ready
                </p>
                <p className="mt-2 text-2xl font-semibold text-blue-950">
                  {aiReadyCount}
                </p>
              </div>
              <div className="rounded-lg bg-teal-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                  Available Dates
                </p>
                <p className="mt-2 text-2xl font-semibold text-teal-950">
                  {availableFollowUpDates.length}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Disease</th>
                    <th className="px-4 py-3">Follow-up Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">AI Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFollowUps.map((followUp) => {
                    const summary = summaries[followUp.patientId];
                    const isGenerating =
                      generatingSummaryId === followUp.patientId;

                    return (
                      <tr key={followUp.id} className="align-top hover:bg-slate-50">
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
                            {safeText(followUp.phoneNumber)}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {safeText(followUp.disease)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {safeText(followUp.followUpDate)}
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            tone={
                              followUp.status === "COMPLETED"
                                ? "green"
                                : "amber"
                            }
                          >
                            {safeText(followUp.status, "Pending")}
                          </Badge>
                        </td>
                        <td className="max-w-xl px-4 py-4">
                          <button
                            type="button"
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
                            disabled={isGenerating || !followUp.patientId}
                            onClick={() => generateSummary(followUp)}
                          >
                            {isGenerating && <Spinner />}
                            {isGenerating ? "Generating" : "Generate Summary"}
                          </button>

                          {summary && (
                            <div className="mt-3 grid gap-3">
                              <section className="rounded-lg bg-teal-50 p-3">
                                <h3 className="text-sm font-semibold text-teal-950">
                                  Patient Brief
                                </h3>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-teal-950">
                                  {safeText(summary.brief)}
                                </p>
                              </section>
                              <section className="rounded-lg bg-blue-50 p-3">
                                <h3 className="text-sm font-semibold text-blue-950">
                                  Follow-up Message
                                </h3>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-blue-950">
                                  {safeText(summary.followUpMessage)}
                                </p>
                              </section>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!filteredFollowUps.length && (
                <p className="p-6 text-sm text-slate-500">
                  No follow-ups match the selected date.
                </p>
              )}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Recent Activity
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest follow-up records sorted by backend priority.
                  </p>
                </div>
                <Link
                  to="/followups"
                  className="text-sm font-bold text-teal-700 hover:text-teal-900"
                >
                  View all
                </Link>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {recentActivity.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                    No follow-up activity is available yet.
                  </p>
                ) : (
                  recentActivity.map((item) => (
                    <article
                      key={item.id}
                      className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div>
                        <p className="font-semibold text-slate-950">
                          {item.patientName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <RiskBadge level={item.risk} />
                        <Badge tone="blue">{item.status}</Badge>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Care Coordination Focus
              </h2>
              <div className="mt-4 grid gap-3">
                <div className="rounded-lg bg-teal-50 p-4">
                  <p className="text-sm font-bold text-teal-900">
                    Prioritize high risk patients first
                  </p>
                  <p className="mt-1 text-sm text-teal-800">
                    Use the patient list filters to isolate urgent care follow-ups.
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm font-bold text-blue-900">
                    Generate AI briefings before calling
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    Patient detail pages combine profile, history, summary, and
                    recommended actions.
                  </p>
                </div>
              </div>
            </aside>
          </section>
        </>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

export default Dashboard;
