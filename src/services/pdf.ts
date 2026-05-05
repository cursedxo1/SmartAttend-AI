import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const exportAttendancePDF = (courseName: string, records: any[], students: any[]) => {
  const doc = new jsPDF() as any;

  doc.setFontSize(20);
  doc.text(`Attendance Report: ${courseName}`, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  const tableData = records.map(record => {
    const student = students.find(s => s.uid === record.userId);
    return [
      student?.displayName || 'Unknown',
      student?.studentId || 'N/A',
      record.date,
      record.status.toUpperCase(),
      new Date(record.timestamp).toLocaleTimeString()
    ];
  });

  doc.autoTable({
    startY: 40,
    head: [['Student Name', 'ID', 'Date', 'Status', 'Time']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`Attendance_${courseName}_${new Date().toISOString().split('T')[0]}.pdf`);
};
