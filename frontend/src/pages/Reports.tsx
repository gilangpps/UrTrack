import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Download,
  FileDown,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';
import { getReports, generateReport } from '../api/endpoints';
import type { Report } from '../types';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    return format(weekStart, 'yyyy-MM-dd');
  });
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await getReports();
      setReports(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const weekStart = new Date(selectedWeek);
      const isoYear = weekStart.getFullYear();
      const janFirst = new Date(isoYear, 0, 1);
      const daysOffset = Math.floor((weekStart.getTime() - janFirst.getTime()) / 86400000);
      const isoWeek = Math.ceil((daysOffset + janFirst.getDay() + 1) / 7);
      const label = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
      const res = await generateReport(label);
      setPreviewReport(res.data);
      toast.success('Report generated');
      fetchReports();
    } catch {
      // handled by interceptor
    } finally {
      setGenerating(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!previewReport) return;
    const blob = new Blob([previewReport.content || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${previewReport.week_label.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markdown exported');
  };

  const handleExportPDF = () => {
    if (!previewReport) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>${previewReport.week_label}</title>
        <style>body{font-family:sans-serif;padding:40px;line-height:1.6}pre{white-space:pre-wrap}</style>
        </head><body><pre>${previewReport.content || ''}</pre>
        <script>window.print();<\/script></body></html>
      `);
      printWindow.document.close();
    }
    toast.success('PDF export initiated');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900">Reports</h1></div>
        <LoadingSkeleton count={3} type="row" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Weekly Report</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Starting</label>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {previewReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{previewReport.week_label}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportMarkdown}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" /> Markdown
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                <FileDown className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{previewReport.content}</pre>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Reports</h2>
        {reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports yet" description="Generate your first weekly report." />
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setPreviewReport(report)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-urtrack-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.week_label}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(report.created_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
