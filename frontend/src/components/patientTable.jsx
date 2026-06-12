function PatientTable({ patients }) {
  return (
    <table
      border="1"
      width="100%"
      style={{ marginTop: "20px" }}
    >
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Disease</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {patients.map((p) => (
          <tr key={p.patientId}>
            <td>{p.patientName}</td>
            <td>{p.phoneNumber}</td>
            <td>{p.disease}</td>
            <td>{p.treatmentStatus}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PatientTable;