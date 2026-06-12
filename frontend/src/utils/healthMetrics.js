export function todayIsoDate() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function safeText(value, fallback = "Not recorded") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function riskLevel(record) {
  const joinedText = [
    record?.priority,
    record?.disease,
    record?.treatmentStatus,
    record?.receptionistNotes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    joinedText.includes("high") ||
    joinedText.includes("urgent") ||
    joinedText.includes("critical") ||
    joinedText.includes("surgery") ||
    joinedText.includes("severe") ||
    joinedText.includes("pain")
  ) {
    return "HIGH";
  }

  const followupDate = record?.followupDate || record?.followUpDate;
  if (followupDate) {
    const daysUntilFollowUp = Math.ceil(
      (new Date(followupDate).getTime() - new Date(todayIsoDate()).getTime()) /
        86400000
    );

    if (daysUntilFollowUp <= 2) {
      return "HIGH";
    }

    if (daysUntilFollowUp <= 7) {
      return "MEDIUM";
    }
  }

  if (
    joinedText.includes("medium") ||
    joinedText.includes("pending") ||
    joinedText.includes("active") ||
    joinedText.includes("follow")
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

export function riskBadgeClasses(level) {
  switch (level) {
    case "HIGH":
      return "border-red-200 bg-red-50 text-red-700";
    case "MEDIUM":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

export function uniqueDiseases(patients) {
  return Array.from(
    new Set(
      patients
        .map((patient) => patient.disease)
        .filter((disease) => typeof disease === "string" && disease.trim())
        .map((disease) => disease.trim())
    )
  ).sort((a, b) => a.localeCompare(b));
}
