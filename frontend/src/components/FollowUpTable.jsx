function FollowUpTable({ followups }) {
  return (
    <table
      border="1"
      width="100%"
      style={{ marginTop: "20px" }}
    >
      <thead>
        <tr>
          <th>Patient ID</th>
          <th>Patient</th>
          <th>Phone</th>
          <th>Disease</th>
          <th>Treatment Status</th>
          <th>Priority</th>
          <th>Date</th>
          <th>Status</th>
          <th>Notes</th>
        </tr>
      </thead>

      <tbody>
        {followups.map((f) => (
          <tr key={f.id}>
            <td>{f.patientId}</td>
            <td>{f.patientName}</td>
            <td>{f.phoneNumber}</td>
            <td>{f.disease}</td>
            <td>{f.treatmentStatus}</td>
            <td>{f.priority}</td>
            <td>{f.followUpDate}</td>
            <td>{f.status}</td>
            <td>{f.receptionistNotes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default FollowUpTable;
