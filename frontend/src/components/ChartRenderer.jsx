import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function ChartRenderer({ chartType, data }) {
  if (!data || data.length === 0) return null;

  // Extract keys for dynamic rendering (ignoring 'name' which is used for X-axis)
  const keys = Object.keys(data[0]).filter(k => k !== 'name');

  // Emerald theme colors
  const COLORS = ['#059669', '#34d399', '#064e3b', '#10b981', '#6ee7b7'];

  // Common wrapper with Recharts ResponsiveContainer
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 500 }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {keys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 500 }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="75%"
                paddingAngle={5}
                dataKey="value" // OpenAI prompt sets 'value' for pie charts usually
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 500 }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {keys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS[index % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-100 shadow-sm p-5 mt-4 mb-2 animate-fade-in">
      <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
        Data Visualization
      </div>
      {renderChart()}
    </div>
  );
}
