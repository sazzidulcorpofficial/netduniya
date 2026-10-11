"use client";

import React, { useEffect, useState } from "react";
import { 
  Briefcase, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  CheckCircle2, 
  Calendar,
  Search,
  Building,
  GraduationCap,
  Users,
  Clock,
  Sparkles,
  AlertCircle,
  FileText,
  X
} from "lucide-react";
import { subscribeToJobs, saveJob, deleteJob, recordAuditLog } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth-context";
import { GovernmentJob } from "@/lib/types";
import { slugify } from "@/lib/utils";

const INDIAN_STATES = [
  "Central Govt",
  "All India",
  "West Bengal",
  "Bihar",
  "Uttar Pradesh",
  "Delhi",
  "Maharashtra",
  "Rajasthan",
  "Madhya Pradesh",
  "Haryana",
  "Punjab",
  "Assam",
  "Odisha",
  "Jharkhand",
  "Gujarat",
  "Karnataka",
  "Tamil Nadu",
  "Other State"
];

export default function AdminJobsPage() {
  const { user: adminUser, profile: adminProfile } = useAuth();
  const [jobs, setJobs] = useState<GovernmentJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'upcoming'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [state, setState] = useState("Central Govt");
  const [totalVacancies, setTotalVacancies] = useState<string | number>("1000+");
  const [qualification, setQualification] = useState("10th / 12th / Graduate");
  const [salaryScale, setSalaryScale] = useState("Level 1 to 7 (₹19,900 - ₹63,200)");
  const [ageLimit, setAgeLimit] = useState("18 - 27 Years");
  const [lastDate, setLastDate] = useState("");
  const [applyUrl, setApplyUrl] = useState("https://ssc.gov.in");
  const [notificationUrl, setNotificationUrl] = useState("");
  const [status, setStatus] = useState<'active' | 'expired' | 'upcoming'>('active');
  const [isVerified, setIsVerified] = useState(true);

  useEffect(() => {
    // Subscribe to all jobs (including inactive/upcoming/expired for admin)
    const unsub = subscribeToJobs((data) => setJobs(data), false);
    return () => unsub();
  }, []);

  const openNew = () => {
    setEditId(null);
    setTitle("");
    setDepartment("");
    setState("Central Govt");
    setTotalVacancies("500+");
    setQualification("10th / 12th / Graduate");
    setSalaryScale("₹21,700 - ₹69,100 (Level 3)");
    setAgeLimit("18 - 27 Years");
    // Default last date to 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setLastDate(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    setApplyUrl("https://");
    setNotificationUrl("");
    setStatus('active');
    setIsVerified(true);
    setModalOpen(true);
  };

  const openEdit = (j: GovernmentJob) => {
    setEditId(j.id);
    setTitle(j.title);
    setDepartment(j.department);
    setState(j.state || "Central Govt");
    setTotalVacancies(j.totalVacancies);
    setQualification(j.qualification);
    setSalaryScale(j.salaryScale || "");
    setAgeLimit(j.ageLimit || "");
    setLastDate(j.lastDate);
    setApplyUrl(j.applyUrl);
    setNotificationUrl(j.notificationUrl || "");
    setStatus(j.status);
    setIsVerified(j.isVerified ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !department.trim() || !applyUrl.trim()) {
      alert("Please fill in Job Title, Department, and Apply URL.");
      return;
    }

    setSaving(true);
    try {
      const now = Date.now();
      const jobObj: GovernmentJob = {
        id: editId || `job-${Date.now()}`,
        title: title.trim(),
        slug: slugify(title.trim()),
        department: department.trim(),
        state,
        totalVacancies: totalVacancies || "Various",
        qualification: qualification.trim(),
        salaryScale: salaryScale.trim(),
        ageLimit: ageLimit.trim(),
        lastDate: lastDate.trim() || "See Notification",
        applyUrl: applyUrl.trim(),
        notificationUrl: notificationUrl.trim(),
        isVerified,
        status,
        sortOrder: editId ? (jobs.find(x => x.id === editId)?.sortOrder || 10) : 1,
        createdAt: editId ? (jobs.find(x => x.id === editId)?.createdAt || now) : now,
        updatedAt: now,
      };

      await saveJob(jobObj);

      await recordAuditLog({
        actorId: adminUser?.uid || "admin",
        actorName: adminProfile?.fullName || "Admin",
        actorRole: adminProfile?.role || "admin",
        action: editId ? "job_update" : "job_create",
        module: "content",
        recordId: jobObj.id,
        details: `${editId ? 'Updated' : 'Added'} Govt Job: ${jobObj.title} (${jobObj.department})`,
      });

      setFeedback(`Job "${jobObj.title}" saved successfully!`);
      setModalOpen(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to save job: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (j: GovernmentJob) => {
    if (!window.confirm(`Are you sure you want to delete / archive "${j.title}"?`)) return;

    try {
      await deleteJob(j.id);
      await recordAuditLog({
        actorId: adminUser?.uid || "admin",
        actorName: adminProfile?.fullName || "Admin",
        actorRole: adminProfile?.role || "admin",
        action: "job_delete",
        module: "content",
        recordId: j.id,
        details: `Deleted / Archived Govt Job: ${j.title}`,
      });
      setFeedback(`Job "${j.title}" removed successfully.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete job: " + (err.message || err));
    }
  };

  const handleToggleStatus = async (j: GovernmentJob) => {
    const nextStatus = j.status === 'active' ? 'expired' : 'active';
    try {
      await saveJob({
        ...j,
        status: nextStatus,
        updatedAt: Date.now()
      });
    } catch (err: any) {
      console.error(err);
      alert("Failed to toggle status");
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch = 
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.state || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.qualification || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = jobs.filter(j => j.status === 'active').length;
  const expiredCount = jobs.filter(j => j.status === 'expired').length;
  const upcomingCount = jobs.filter(j => j.status === 'upcoming').length;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>Government Jobs & Sarkari Bharti CMS</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200">
                Live Real-Time
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Create, edit, archive, and manage central & state government recruitments visible on homepage and job portal.
            </p>
          </div>
        </div>

        <button
          onClick={openNew}
          className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add New Govt Job</span>
        </button>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Jobs</span>
          <span className="text-lg font-black text-slate-900">{jobs.length}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Active & Open</span>
          <span className="text-lg font-black text-emerald-800">{activeCount}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Upcoming</span>
          <span className="text-lg font-black text-amber-800">{upcomingCount}</span>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-rose-700 block">Expired / Closed</span>
          <span className="text-lg font-black text-rose-800">{expiredCount}</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by job title, department, state, qualification..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {(['all', 'active', 'upcoming', 'expired'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Table & Mobile Cards */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Recruitment / Job Title</th>
                <th className="py-3 px-3">State / Scope</th>
                <th className="py-3 px-3">Vacancies</th>
                <th className="py-3 px-3">Eligibility</th>
                <th className="py-3 px-3">Last Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Briefcase className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold">No government jobs found matching filter</p>
                    <button
                      onClick={openNew}
                      className="mt-3 text-xs font-bold text-brand-blue hover:underline"
                    >
                      + Add your first government job
                    </button>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 group-hover:text-brand-blue transition line-clamp-1 max-w-xs">
                        {j.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                        <Building className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[240px]">{j.department}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                        {j.state || "Central Govt"}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-black text-slate-900">
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                        {j.totalVacancies} Posts
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="max-w-[160px] truncate text-[11px] text-slate-600 font-medium" title={j.qualification}>
                        {j.qualification}
                      </div>
                      {j.salaryScale && (
                        <div className="text-[10px] text-emerald-700 font-bold truncate max-w-[160px]">
                          {j.salaryScale}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1 font-bold text-slate-900">
                        <Calendar className="h-3 w-3 text-rose-500" />
                        <span>{j.lastDate}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(j)}
                        title="Click to toggle status"
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition border ${
                          j.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : j.status === 'upcoming'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          j.status === 'active' ? 'bg-emerald-500' : j.status === 'upcoming' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className="capitalize">{j.status}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <a
                          href={j.applyUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Apply Link"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEdit(j)}
                          title="Edit Job Details"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(j)}
                          title="Delete Job"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-blue-400" />
                <h2 className="text-sm sm:text-base font-black">
                  {editId ? "Edit Government Job Posting" : "Add New Government Job (Sarkari Bharti)"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Job Title */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  Job Title / Post Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSC CGL 2026 / Railway RRB ALP Recruitment / Indian Army Agniveer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              {/* Department & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    Department / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Staff Selection Commission (SSC)"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    State / Jurisdiction
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Vacancies & Last Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    Total Vacancies / Posts
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 17,727 Posts or 5,000+"
                    value={totalVacancies}
                    onChange={(e) => setTotalVacancies(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    Application Last Date *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 31 Oct 2026 or 15 Nov 2026"
                    value={lastDate}
                    onChange={(e) => setLastDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* Educational Qualification & Age Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    Required Educational Qualification *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10th Pass / 12th Pass / Any Bachelor Degree"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    Age Limit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18 - 27 Years (Relaxation as per rules)"
                    value={ageLimit}
                    onChange={(e) => setAgeLimit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* Salary Scale */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  Salary / Pay Scale (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Level 4 (₹25,500 - ₹81,100) or ₹35,400/month"
                  value={salaryScale}
                  onChange={(e) => setSalaryScale(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              {/* Official Apply URL & Notification PDF URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    Official Apply URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://official-portal.gov.in"
                    value={applyUrl}
                    onChange={(e) => setApplyUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    Notification PDF URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://.../notification.pdf"
                    value={notificationUrl}
                    onChange={(e) => setNotificationUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* Status & Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    Recruitment Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="active">Active & Open</option>
                    <option value="upcoming">Upcoming Notification</option>
                    <option value="expired">Expired / Closed</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-xs font-black text-slate-900 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue h-4 w-4"
                    />
                    <span>Show Official Verification Seal 🛡️</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-blue hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{saving ? "Saving Job..." : editId ? "Update Job Posting" : "Publish Govt Job"}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
