import { useEffect, useRef, useState } from "react";
import Toast from "../components/Toast";
import { uploadPatientsAndMessages } from "../services/api";

function isExcel(file) {
  return file && /\.(xlsx|xls)$/i.test(file.name);
}

function FileDropZone({ id, label, description, file, onFileChange }) {
  const inputRef = useRef(null);
  const valid = !file || isExcel(file);

  const selectFile = (selectedFile) => {
    onFileChange(selectedFile || null);
  };

  return (
    <section
      className={`grid min-h-52 cursor-pointer gap-4 rounded-lg border-2 border-dashed p-5 transition ${
        file
          ? valid
            ? "border-teal-500 bg-teal-50"
            : "border-red-300 bg-red-50"
          : "border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50"
      }`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        selectFile(event.dataTransfer.files?.[0]);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".xlsx,.xls"
        className="sr-only"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-teal-700 text-2xl font-bold text-white">
        +
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{label}</h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <p className={`mt-4 text-sm font-bold ${valid ? "text-teal-800" : "text-red-700"}`}>
          {file ? file.name : "Drop Excel file here or browse"}
        </p>
        {!valid && (
          <p className="mt-2 text-sm font-semibold text-red-700">
            Only .xlsx and .xls files are accepted.
          </p>
        )}
      </div>
    </section>
  );
}

function UploadCenter() {
  const [patientFile, setPatientFile] = useState(null);
  const [messageFile, setMessageFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const validationMessages = [
    !patientFile && "Patient Excel file is required.",
    !messageFile && "WhatsApp message Excel file is required.",
    patientFile && !isExcel(patientFile) && "Patient file must be .xlsx or .xls.",
    messageFile && !isExcel(messageFile) && "Message file must be .xlsx or .xls.",
  ].filter(Boolean);

  const canUpload = validationMessages.length === 0 && !uploading;

  const uploadFiles = async () => {
    if (!canUpload) {
      setToast({
        type: "error",
        message: validationMessages[0] || "Upload is already in progress.",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const response = await uploadPatientsAndMessages(
        patientFile,
        messageFile,
        (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded * 100) / event.total));
          }
        }
      );

      setToast({
        type: "success",
        message: response.data?.message || "Excel data uploaded successfully.",
      });
      setPatientFile(null);
      setMessageFile(null);
      setProgress(100);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error.response?.data?.message ||
          "Upload failed. Check both Excel files and try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-wide text-teal-700">
          Data Intake
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
          Upload Center
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Import patient records and WhatsApp conversations together so AI
          summaries have enough clinical and communication context.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <FileDropZone
          id="patient-file"
          label="Patient Excel"
          description="Patient ID, name, phone, disease, treatment status, follow-up date, and receptionist notes."
          file={patientFile}
          onFileChange={setPatientFile}
        />
        <FileDropZone
          id="message-file"
          label="WhatsApp Excel"
          description="Recent patient conversations used by the follow-up assistant for context."
          file={messageFile}
          onFileChange={setMessageFile}
        />
      </section>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Upload Validation
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Both Excel files are required before upload begins.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
            onClick={uploadFiles}
            disabled={uploading}
          >
            {uploading ? "Uploading" : "Upload Files"}
          </button>
        </div>

        <div className="grid gap-2">
          {validationMessages.length === 0 ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              Files are ready for upload.
            </p>
          ) : (
            validationMessages.map((message) => (
              <p
                key={message}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800"
              >
                {message}
              </p>
            ))
          )}
        </div>

        {uploading && (
          <div className="relative h-9 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-teal-600 transition-all"
              style={{ width: `${progress}%` }}
            />
            <span className="absolute inset-0 grid place-items-center text-sm font-bold text-slate-950">
              {progress}%
            </span>
          </div>
        )}
      </section>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}

export default UploadCenter;
