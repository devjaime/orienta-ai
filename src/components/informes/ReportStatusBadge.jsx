import { STATUS_LABELS, STATUS_COLORS } from '../../lib/reportService';

const ReportStatusBadge = ({ status }) => {
  const label = STATUS_LABELS[status] || status;
  const colorClass = STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-400';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
};

export default ReportStatusBadge;
