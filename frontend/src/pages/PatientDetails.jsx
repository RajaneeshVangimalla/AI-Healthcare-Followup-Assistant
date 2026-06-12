import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Badge from "../components/Badge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Toast from "../components/Toast";
import {
  generatePatientAnalysis,
  getPatient,
  getPatientMessages,
} from "../services/api";
import { safeText } from "../utils/healthMetrics";

function PatientDetails() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getPatient(patientId), getPatientMessages(patientId)])
      .then(([patientResponse, messageResponse]) => {
        if (!ignore) {
          setPatient(patientResponse.data);
          setMessages(messageResponse.data || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Unable to load patient details.");
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
  }, [patientId]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const generateSummary = async () => {
    if (!patient?.patientId) {
      setToast({ type: "error", message: "Patient record is missing." });
      return;
    }

    setAnalysisLoading(true);
    setAnalysis(null);

    try {
      const response = await generatePatientAnalysis(patient.patientId, {
        patientDetails: patient,
        whatsappMessages: messages,
      });
      setAnalysis(response.data);
      setToast({ type: "success", message: "AI summary generated." });
    } catch (err) {
      setToast({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Unable to generate AI summary. Please try again.",
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <LoadingSkeleton rows={6} />
      </main>
    );
  }

  if (error || !patient) {
    return (
      <main className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
          <h1 className="text-2xl font-semibold">Patient not available</h1>
          <p className="mt-2 text-sm">{error || "No patient record was found."}</p>
        </section>
        <Link className="text-sm font-bold text-teal-700" to="/patients">
          Back to patients
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/patients" className="text-sm font-bold text-teal-700">
            Back to patients
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
            {safeText(patient.patientName)}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {safeText(patient.disease)} care follow-up workspace
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={patient.followUpCompleted ? "green" : "amber"}>
            {patient.followUpCompleted ? "Completed" : "Pending"}
          </Badge>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Patient Profile
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            {[
              ["Patient ID", patient.patientId],
              ["Phone", patient.phoneNumber],
              ["Availability", patient.patientAvailability],
              ["Follow-up Date", patient.followupDate],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3"
              >
                <dt className="font-semibold text-slate-500">{label}</dt>
                <dd className="text-right font-semibold text-slate-950">
                  {safeText(value)}
                </dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Medical Information
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <section className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Disease
              </p>
              <p className="mt-2 font-semibold text-slate-950">
                {safeText(patient.disease)}
              </p>
            </section>
            <section className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Treatment Status
              </p>
              <p className="mt-2 font-semibold text-slate-950">
                {safeText(patient.treatmentStatus)}
              </p>
            </section>
          </div>
          <section className="mt-4 rounded-lg bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Receptionist Notes
            </p>
            <p className="mt-2 text-sm text-blue-900">
              {safeText(patient.receptionistNotes)}
            </p>
          </section>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            WhatsApp Chat History
          </h2>
          <div className="mt-4 grid max-h-[420px] gap-3 overflow-auto pr-1">
            {messages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No WhatsApp messages are available for this patient.
              </p>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-950">
                      {safeText(message.patientName, "Patient")}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {safeText(message.messageDate, "No date")}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {safeText(message.message, "Empty message")}
                  </p>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                AI Summary
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Generate a receptionist-ready brief and WhatsApp follow-up.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
              onClick={generateSummary}
              disabled={analysisLoading}
            >
              {analysisLoading && <Spinner />}
              {analysisLoading ? "Generating Summary" : "Generate Summary"}
            </button>
          </div>

          {analysisLoading && (
            <div className="mt-4">
              <LoadingSkeleton rows={3} />
            </div>
          )}

          {analysis && (
            <div className="mt-4 grid gap-4">
              <section className="rounded-lg bg-teal-50 p-4">
                <h3 className="text-base font-semibold text-teal-950">
                  Patient Brief
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-teal-950">
                  {safeText(analysis.brief, "No patient brief returned.")}
                </p>
              </section>
              <section className="rounded-lg bg-blue-50 p-4">
                <h3 className="text-base font-semibold text-blue-950">
                  Follow-up Message
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-blue-950">
                  {safeText(
                    analysis.followUpMessage,
                    "No follow-up message returned."
                  )}
                </p>
              </section>
            </div>
          )}
        </article>
      </section>

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

export default PatientDetails;
