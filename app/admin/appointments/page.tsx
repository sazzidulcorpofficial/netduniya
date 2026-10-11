"use client";

import React, { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  AlertCircle,
  Trash2,
  Edit3,
  X,
  Loader2,
  User,
  Phone,
  Layers
} from "lucide-react";
import { 
  subscribeToAllAppointments, 
  updateAppointmentStatus,
  deleteAppointment 
} from "@/lib/firestore-service";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { formatDateTime, getStatusBadgeClass, formatStatusLabel } from "@/lib/utils";

export default function AdminAppointmentsPage() {
  const [apts, setApts] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Status update modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<AppointmentStatus>('confirmed');
  const [staffNote, setStaffNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAllAppointments((data) => {
      setApts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = apts.filter(a => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;
    const matchesSearch =
      (a.id || "").toLowerCase().includes(q) ||
      (a.userName || "").toLowerCase().includes(q) ||
      (a.userPhone || "").toLowerCase().includes(q) ||
      (a.serviceName || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleOpenStatusModal = (apt: Appointment) => {
    setSelectedApt(apt);
    setNewStatus(apt.status);
    setStaffNote(apt.adminNotes || apt.notes || "");
    setModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt) return;
    setUpdating(true);
    try {
      await updateAppointmentStatus(selectedApt.id, newStatus, staffNote.trim() || undefined);
      alert(`Appointment ${selectedApt.id} status updated to ${formatStatusLabel(newStatus)}.`);
      setModalOpen(false);
    } catch (err: any) {
      alert("Failed to update status: " + (err.message || err));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete appointment ${id} for ${name}?`)) return;
    try {
      await deleteAppointment(id);
    } catch (err: any) {
      alert("Failed to delete appointment: " + (err.message || err));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900">Appointment Management & Kendra Slots</h1>
          <p className="text-xs text-slate-500">Manage citizen appointment bookings, attendance, and rescheduling slots.</p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
          Total: {apts.length} Bookings
        </span>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, phone or service..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
          {["all", "pending", "confirmed", "completed", "rescheduled", "cancelled"].map((st) => (
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
      <div className="overflow-x-auto w-full border border-slate-200 rounded-xl shadow-xs">
        <table className="min-w-full whitespace-nowrap text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">Appointment ID</th>
              <th className="p-3.5">Candidate Name</th>
              <th className="p-3.5">Mobile Phone</th>
              <th className="p-3.5">Service Required</th>
              <th className="p-3.5">Date & Time Slot</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Staff Notes</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-blue" />
                  Loading appointments...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  No appointments found matching your search.
                </td>
              </tr>
            ) : (
              filtered.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-brand-blue">
                    {apt.id}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">
                    {apt.userName}
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {apt.userPhone || "—"}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    {apt.serviceName}
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 block">{apt.appointmentDate}</span>
                    <span className="text-[11px] text-amber-600 font-semibold">{apt.timeSlot}</span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(apt.status)}`}>
                      {formatStatusLabel(apt.status)}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 max-w-xs truncate">
                    {apt.adminNotes || apt.notes || "—"}
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal(apt)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-brand-blue font-bold hover:bg-blue-100 transition inline-flex items-center space-x-1 cursor-pointer"
                      title="Update Appointment Status"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Update</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(apt.id, apt.userName)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition inline-flex items-center space-x-1 cursor-pointer"
                      title="Delete Appointment"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Status Update Modal */}
      {modalOpen && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-brand-blue">{selectedApt.id}</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Update Slot Status</h3>
                <p className="text-xs text-slate-500">
                  Candidate: <strong>{selectedApt.userName}</strong> &bull; {selectedApt.appointmentDate} ({selectedApt.timeSlot})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AppointmentStatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="pending">Pending (Awaiting Confirmation)</option>
                  <option value="confirmed">Confirmed (Slot Reserved)</option>
                  <option value="completed">Completed (Citizen Attended)</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show (Did not arrive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Note (Optional)</label>
                <textarea
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Verified Aadhaar and biometrics in person."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs shadow transition disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
