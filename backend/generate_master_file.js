import xlsx from 'xlsx';

const masterData = [
  { Date: '2026-01-05', Department: 'Sales', Revenue: 12000, Expenses: 4500, New_Clients: 15, Status: 'Profit' },
  { Date: '2026-01-12', Department: 'Marketing', Revenue: 0, Expenses: 6000, New_Clients: 40, Status: 'Loss' },
  { Date: '2026-01-18', Department: 'Engineering', Revenue: 0, Expenses: 8500, New_Clients: 0, Status: 'Loss' },
  { Date: '2026-01-25', Department: 'Sales', Revenue: 18000, Expenses: 5000, New_Clients: 22, Status: 'Profit' },
  { Date: '2026-02-02', Department: 'Sales', Revenue: 14500, Expenses: 4000, New_Clients: 18, Status: 'Profit' },
  { Date: '2026-02-14', Department: 'Marketing', Revenue: 0, Expenses: 5500, New_Clients: 35, Status: 'Loss' },
  { Date: '2026-02-20', Department: 'Engineering', Revenue: 0, Expenses: 8000, New_Clients: 0, Status: 'Loss' },
  { Date: '2026-02-28', Department: 'Sales', Revenue: 21000, Expenses: 6000, New_Clients: 28, Status: 'Profit' },
  { Date: '2026-03-05', Department: 'Sales', Revenue: 16000, Expenses: 4500, New_Clients: 20, Status: 'Profit' },
  { Date: '2026-03-15', Department: 'Marketing', Revenue: 0, Expenses: 4000, New_Clients: 25, Status: 'Loss' },
  { Date: '2026-03-22', Department: 'Engineering', Revenue: 0, Expenses: 8200, New_Clients: 0, Status: 'Loss' },
  { Date: '2026-03-30', Department: 'Sales', Revenue: 25000, Expenses: 7000, New_Clients: 35, Status: 'Profit' }
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(masterData);
xlsx.utils.book_append_sheet(wb, ws, 'Q1 Master Metrics');
xlsx.writeFile(wb, 'Q1_Master_Business_Report.xlsx');

console.log('✅ Success! Master demo file generated: Q1_Master_Business_Report.xlsx');
