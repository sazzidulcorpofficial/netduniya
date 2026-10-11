"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FileText, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Send,
  Loader2,
  FileCheck,
  Trash2,
  Eye,
  X,
  Sparkles,
  User,
  Phone,
  Mail,
  Calendar,
  RotateCcw,
  Wallet
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  subscribeToAllApplications, 
  updateApplicationStatus,
  deleteApplication,
  refundServiceApplication
} from "@/lib/firestore-service";
import { ServiceApplication, ApplicationStatus } from "@/lib/types";
import { formatDateTime, formatCurrency, getStatusBadgeClass, formatStatusLabel } from "@/lib/utils";

function AdminApplicationsContent() {
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get("id");
  const { profile, user } = useAuth();

  const [apps, setApps] = useState<ServiceApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<ServiceApplication | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Status Change Form
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('under_review');
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineDesc, setTimelineDesc] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAllApplications((data) => {
      setApps(data);
      if (highlightedId) {
        const found = data.find(a => a.id === highlightedId);
        if (found) {
          setSelectedApp(found);
          setNewStatus(found.status);
          setAdminNotes(found.adminNotes || "");
          setInspectModalOpen(true);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [highlightedId]);

  const filtered = apps.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;
    const matchesSearch =
      (a.id || "").toLowerCase().includes(q) ||
      (a.serviceName || "").toLowerCase().includes(q) ||
      (a.userName || "").toLowerCase().includes(q) ||
      (a.userEmail || "").toLowerCase().includes(q) ||
      (a.userPhone || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleOpenInspect = (app: ServiceApplication) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setAdminNotes(app.adminNotes || "");
    setTimelineTitle("");
    setTimelineDesc("");
    setInspectModalOpen(true);
  };

  const handleDelete = async (appId: string, applicantName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete application ${appId} for ${applicantName}?`)) {
      return;
    }
    try {
      await deleteApplication(appId);
      if (selectedApp?.id === appId) {
        setInspectModalOpen(false);
        setSelectedApp(null);
      }
    } catch (err: any) {
      alert("Failed to delete application: " + (err.message || err));
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setUpdating(true);
    try {
      const defaultTitle = `Status updated to ${formatStatusLabel(newStatus)}`;
      const defaultDesc = `Application status changed by staff ${profile?.fullName || user?.email || 'admin'}.`;

      await updateApplicationStatus(
        selectedApp.id,
        newStatus,
        timelineTitle.trim() || defaultTitle,
        timelineDesc.trim() || defaultDesc,
        profile?.fullName || user?.email || 'Admin Staff',
        adminNotes
      );

      // Keep selectedApp refreshed
      setSelectedApp(prev => prev ? ({ ...prev, status: newStatus, adminNotes }) : null);
      alert(`Application ${selectedApp.id} status updated to ${formatStatusLabel(newStatus)}`);
      setInspectModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update application status");
    } finally {
      setUpdating(false);
    }
  };

  const [refundingApp, setRefundingApp] = useState(false);

  const handleRefundApp = async () => {
    if (!selectedApp) return;
    if (selectedApp.paymentStatus === 'refunded' || (selectedApp as any).isRefunded || (selectedApp as any).refundProcessed) {
      alert("This application fee has already been refunded to citizen wallet.");
      return;
    }
    const refundAmt = selectedApp.feePaid || 0;
    if (!window.confirm(`Are you sure you want to REJECT and REFUND ₹${refundAmt} directly to citizen ${selectedApp.userName}'s NetDuniya Digital Wallet balance?`)) {
      return;
    }
    setRefundingApp(true);
    try {
      const res = await refundServiceApplication(selectedApp.id, {
        adminName: profile?.fullName || user?.email || 'Admin Staff',
        reason: adminNotes.trim() || 'Application rejected by admin - fee refunded to citizen wallet'
      });
      // Instantly update local application states so button permanently closes
      setSelectedApp(prev => prev ? {
        ...prev,
        paymentStatus: 'refunded',
        status: 'rejected',
        isRefunded: true,
        refundProcessed: true,
      } : null);
      setApps(prev => prev.map(a => a.id === selectedApp.id ? {
        ...a,
        paymentStatus: 'refunded',
        status: 'rejected',
        isRefunded: true,
        refundProcessed: true,
      } : a));
      alert(`Success! ₹${res.refundedAmount} has been credited directly to ${selectedApp.userName}'s citizen digital wallet.`);
      setInspectModalOpen(false);
    } catch (err: any) {
      alert("Refund failed: " + (err.message || err));
    } finally {
      setRefundingApp(false);
    }
  };

  // Status Counts
  const countTotal = apps.length;
  const countSubmitted = apps.filter(a => a.status === 'submitted').length;
  const countReview = apps.filter(a => a.status === 'under_review' || a.status === 'in_processing').length;
  const countApproved = apps.filter(a => a.status === 'approved' || a.status === 'completed').length;
  const countRejected = apps.filter(a => a.status === 'rejected').length;

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2">
        <div>
          <h1 className="text-lg font-black text-slate-900">Application Management & Verification</h1>
          <p className="text-xs text-slate-500">Review incoming citizen applications, inspect uploaded documents, and update status timelines.</p>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
          Total: <strong>{countTotal}</strong> Applications
        </span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-[11px] font-bold text-blue-700">New Submitted</p>
          <p className="text-lg font-black text-blue-900 mt-0.5">{countSubmitted}</p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-[11px] font-bold text-amber-700">Under Review</p>
          <p className="text-lg font-black text-amber-900 mt-0.5">{countReview}</p>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-[11px] font-bold text-emerald-700">Approved / Done</p>
          <p className="text-lg font-black text-emerald-900 mt-0.5">{countApproved}</p>
        </div>
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
          <p className="text-[11px] font-bold text-rose-700">Rejected / On Hold</p>
          <p className="text-lg font-black text-rose-900 mt-0.5">{countRejected}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, applicant name, phone, or service..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
          {["all", "submitted", "under_review", "in_processing", "approved", "completed", "rejected"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                statusFilter === st ? "bg-brand-blue text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "all" ? "All" : formatStatusLabel(st)}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Responsive Table (Single Line per Row + Horizontal Scroll) */}
      <div className="admin-table-container overflow-x-auto w-full border-2 border-slate-300 rounded-xl shadow-xs">
        <table className="min-w-full whitespace-nowrap text-left text-xs">
          <thead className="bg-slate-100 text-slate-900 font-black uppercase text-[11px] border-b-2 border-slate-300">
            <tr>
              <th className="p-3.5 text-slate-900">Application ID</th>
              <th className="p-3.5 text-slate-900">Service Requested</th>
              <th className="p-3.5 text-slate-900">Applicant Name</th>
              <th className="p-3.5 text-slate-900">Contact Phone</th>
              <th className="p-3.5 text-slate-900">Fee Paid</th>
              <th className="p-3.5 text-slate-900">Status</th>
              <th className="p-3.5 text-slate-900">Submitted On</th>
              <th className="p-3.5 text-right text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-blue" />
                  Loading applications...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  No applications found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-brand-blue">
                    {app.id}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">
                    {app.serviceName}
                  </td>
                  <td className="p-3.5 font-medium text-slate-800">
                    {app.userName || "Citizen"}
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {app.userPhone || "—"}
                  </td>
                  <td className="p-3.5 font-black text-emerald-700">
                    {formatCurrency(app.feePaid || 0)}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(app.status)}`}>
                      {formatStatusLabel(app.status)}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px]">
                    {formatDateTime(app.createdAt)}
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenInspect(app)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-brand-blue font-bold hover:bg-blue-100 transition inline-flex items-center space-x-1 cursor-pointer"
                      title="Inspect Form & Update Status"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Review</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(app.id, app.userName || 'Applicant')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition inline-flex items-center space-x-1 cursor-pointer"
                      title="Delete Application"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review & Status Update Modal */}
      {inspectModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 text-brand-blue rounded border border-blue-200">
                    {selectedApp.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeClass(selectedApp.status)}`}>
                    {formatStatusLabel(selectedApp.status)}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {selectedApp.serviceName}
                </h2>
                <p className="text-xs text-slate-500">
                  Applicant: <strong>{selectedApp.userName}</strong> &bull; {selectedApp.userPhone} &bull; {selectedApp.userEmail}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Submitted Form Fields */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <FileText className="h-3.5 w-3.5 text-brand-blue" />
                <span>Submitted Form Fields</span>
              </h3>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {selectedApp.formData && Object.keys(selectedApp.formData).length > 0 ? (
                  Object.entries(selectedApp.formData).map(([k, v]) => {
                    if (typeof v === 'string' && (v.startsWith('http') || v.includes('storage'))) return null;
                    return (
                      <div key={k} className="p-2 bg-white rounded-lg border border-slate-100">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">{k}:</span>
                        <strong className="text-slate-800 break-words">{String(v)}</strong>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 text-xs col-span-2">No custom form fields recorded.</p>
                )}
              </div>
            </div>

            {/* Attached Documents */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Uploaded Documents</span>
              </h3>
              {selectedApp.documents && selectedApp.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedApp.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-brand-blue hover:bg-blue-50/50 transition shadow-xs group"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileCheck className="h-4 w-4 text-brand-blue flex-shrink-0" />
                        <span className="truncate font-semibold text-slate-800 group-hover:text-brand-blue">{doc.fileName}</span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 ml-1" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border">No documents attached.</p>
              )}
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleStatusUpdate} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                Update Status & Timeline Entry
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select New Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="in_processing">In Processing</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Timeline Step Title (Optional)</label>
                  <input
                    type="text"
                    value={timelineTitle}
                    onChange={(e) => setTimelineTitle(e.target.value)}
                    placeholder="e.g. Documents Verified at Center"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Timeline Description (Optional)</label>
                <textarea
                  value={timelineDesc}
                  onChange={(e) => setTimelineDesc(e.target.value)}
                  rows={2}
                  placeholder="e.g. Identity verified successfully. Form forwarded to central authority."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Admin Notes</label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Private staff reference note..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200">
                {!(selectedApp.paymentStatus === 'refunded' || (selectedApp as any).isRefunded || (selectedApp as any).refundProcessed || selectedApp.status === 'rejected') ? (
                  <button
                    type="button"
                    onClick={handleRefundApp}
                    disabled={refundingApp}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    title="Reject and credit application fee directly back to citizen's wallet"
                  >
                    {refundingApp ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span>Refund ₹{selectedApp.feePaid || 0} to Citizen Wallet</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200 flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Refund Closed &amp; Fee Credited to Wallet</span>
                  </span>
                )}

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setInspectModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>Save Status Update</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Timeline History */}
            {selectedApp.timeline && selectedApp.timeline.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-600">Timeline History:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedApp.timeline.map((t, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs flex justify-between items-start">
                      <div>
                        <strong className="text-slate-800">{t.title}</strong>
                        <p className="text-slate-500 text-[11px] mt-0.5">{t.description}</p>
                        <span className="text-[10px] text-slate-400">By: {t.actor}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{formatDateTime(t.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Applications...</div>}>
      <AdminApplicationsContent />
    </Suspense>
  );
}
