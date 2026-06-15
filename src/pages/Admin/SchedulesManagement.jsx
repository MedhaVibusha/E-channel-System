import React, { useState, useEffect } from "react";
import useFetchData from "../../hooks/useFetchData";
import { BASE_URL } from "../../config";
import HashLoader from "react-spinners/HashLoader";
import { toast } from "react-toastify";
import { AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineEdit, AiOutlineClose, AiOutlinePlus, AiOutlineDelete, AiOutlineClockCircle } from "react-icons/ai";
import convertTime from "../../../utils/convertTime";

const SchedulesManagement = () => {
  const { data: doctorsData, loading, error, refetch } = useFetchData(`${BASE_URL}/admin/schedules`);
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorList, setDoctorList] = useState([]);
  
  // Slot Editor Modal states
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [modalTimeSlots, setModalTimeSlots] = useState([]);
  const [newDay, setNewDay] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [savingSlots, setSavingSlots] = useState(false);

  useEffect(() => {
    if (doctorsData) {
      setDoctorList(doctorsData);
    }
  }, [doctorsData]);

  const filteredDoctors = doctorList?.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (doctorId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/admin/schedules/${doctorId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ scheduleStatus: newStatus })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      toast.success(`Schedule status updated to ${newStatus}`);
      setDoctorList(prev => prev.map(doc => doc._id === doctorId ? { ...doc, scheduleStatus: newStatus } : doc));
    } catch (err) {
      toast.error(err.message || "Failed to update schedule status");
    }
  };

  const handleOpenSlotEditor = (doctor) => {
    setSelectedDoctor(doctor);
    setModalTimeSlots(doctor.timeSlots || []);
    setNewDay("");
    setNewStart("");
    setNewEnd("");
  };

  const handleAddSlotLocally = (e) => {
    e.preventDefault();
    if (!newDay || !newStart || !newEnd) {
      toast.error("Please fill in all slot fields");
      return;
    }

    const isDuplicate = modalTimeSlots.some(
      (slot) =>
        slot.day.toLowerCase() === newDay.toLowerCase() &&
        slot.startingTime === newStart &&
        slot.endingTime === newEnd
    );

    if (isDuplicate) {
      toast.error("This slot already exists");
      return;
    }

    setModalTimeSlots([
      ...modalTimeSlots,
      { day: newDay, startingTime: newStart, endingTime: newEnd, enabled: true }
    ]);
    setNewDay("");
    setNewStart("");
    setNewEnd("");
  };

  const handleDeleteSlotLocally = (index) => {
    setModalTimeSlots(modalTimeSlots.filter((_, idx) => idx !== index));
  };

  const handleToggleSlotLocally = (index) => {
    const updated = [...modalTimeSlots];
    updated[index].enabled = updated[index].enabled !== false ? false : true;
    setModalTimeSlots(updated);
  };

  const handleSaveSlots = async () => {
    setSavingSlots(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/admin/schedules/${selectedDoctor._id}/slots`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ timeSlots: modalTimeSlots })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      toast.success("Doctor schedule slots saved successfully!");
      setDoctorList(prev => prev.map(doc => doc._id === selectedDoctor._id ? { ...doc, timeSlots: modalTimeSlots } : doc));
      setSelectedDoctor(null);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to save slots");
    } finally {
      setSavingSlots(false);
    }
  };

  return (
    <section className="font-sans">
      <div className="flex flex-col mb-8 gap-6">
        <h2 className="text-3xl font-bold text-headingColor dark:text-white">Admin Schedule Approval & Management</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
          <input
            type="search"
            placeholder="Search doctors by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2.5 px-4 bg-[#0066ff0d] text-headingColor placeholder:text-textColor border border-solid border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white w-full md:w-[400px] text-xs font-semibold"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-40">
          <HashLoader size={40} color="#0067FF" />
        </div>
      )}
      {error && <p className="text-red-500 font-semibold text-center">{error}</p>}

      {!loading && !error && filteredDoctors && (
        <div className="bg-white dark:bg-slate-800 shadow-panelShadow rounded-xl overflow-hidden border border-solid border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f4f7ff] dark:bg-slate-700 text-textColor dark:text-gray-300 uppercase text-xs font-bold border-b border-solid border-gray-100">
                <tr>
                  <th className="px-6 py-4">Doctor Name</th>
                  <th className="px-6 py-4">Speciality</th>
                  <th className="px-6 py-4">Slots Count</th>
                  <th className="px-6 py-4">Schedule Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDoctors.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={doc.photo || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-full object-cover border border-solid border-gray-100" />
                      <div>
                        <span className="font-bold text-headingColor dark:text-white block">{doc.name}</span>
                        <span className="text-[10px] text-textColor font-mono uppercase tracking-wider">{doc.doctorId || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-textColor font-semibold dark:text-gray-300 capitalize">{doc.specialization || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center bg-blue-50 border border-solid border-blue-100 text-primaryColor font-bold rounded-lg px-2.5 py-0.5 text-xs">
                        {doc.timeSlots?.length || 0} Slots
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={doc.scheduleStatus || "Pending Approval"}
                        onChange={(e) => handleStatusChange(doc._id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg border-none font-bold text-xs cursor-pointer outline-none focus:ring-2 focus:ring-primaryColor ${
                          doc.scheduleStatus === "Approved" ? "bg-green-100 text-green-700" :
                          doc.scheduleStatus === "Cancelled" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-750"
                        }`}
                      >
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenSlotEditor(doc)}
                        className="bg-primaryColor hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 inline-flex cursor-pointer"
                      >
                        <AiOutlineEdit className="text-sm" /> Edit Slots
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDoctors.length === 0 && (
              <div className="p-10 text-center text-textColor dark:text-gray-400 italic text-xs">
                No doctors found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📅 INTERACTIVE SLOT EDITOR MODAL */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-solid border-gray-100 relative max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-primaryColor px-6 py-5 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold">Edit Schedule Slots: {selectedDoctor.name}</h3>
                <p className="text-blue-100 text-xs mt-0.5">Manage session times and visibility directly</p>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-1.5 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors cursor-pointer"
              >
                <AiOutlineClose className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
              
              {/* Left Form: Add Slot (5/12) */}
              <div className="md:col-span-5 bg-gray-50 border border-solid border-gray-100 rounded-xl p-5 h-fit space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-headingColor border-b border-gray-200 pb-2">
                  Create Time Slot
                </h4>
                <form onSubmit={handleAddSlotLocally} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-textColor block mb-1">Day of Week</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 border border-solid border-gray-200 rounded-lg focus:outline-none focus:border-primaryColor text-headingColor bg-white cursor-pointer"
                    >
                      <option value="">Select Day</option>
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-textColor block mb-1">Starting Time</label>
                    <input
                      type="time"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 border border-solid border-gray-200 rounded-lg focus:outline-none focus:border-primaryColor text-headingColor"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-textColor block mb-1">Ending Time</label>
                    <input
                      type="time"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 border border-solid border-gray-200 rounded-lg focus:outline-none focus:border-primaryColor text-headingColor"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primaryColor hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <AiOutlinePlus className="text-sm" /> Add Slot Locally
                  </button>
                </form>
              </div>

              {/* Right Slots Listing: (7/12) */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-headingColor border-b border-gray-100 pb-2">
                  Active Scheduling Slots ({modalTimeSlots.length})
                </h4>

                {modalTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {modalTimeSlots.map((slot, index) => {
                      const isEnabled = slot.enabled !== false;
                      return (
                        <div
                          key={index}
                          className={`border border-solid rounded-xl p-3.5 space-y-2.5 transition-all shadow-sm ${
                            isEnabled
                              ? "bg-white border-gray-100 hover:border-gray-200"
                              : "bg-gray-50 border-gray-200 opacity-75"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-headingColor capitalize text-xs">{slot.day}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlotLocally(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete Slot"
                            >
                              <AiOutlineDelete className="text-sm" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-textColor">
                            <AiOutlineClockCircle className="text-sm" />
                            <span>
                              {convertTime(slot.startingTime)} - {convertTime(slot.endingTime)}
                            </span>
                          </div>

                          <div className="flex items-center justify-end border-t border-solid border-gray-50 pt-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleToggleSlotLocally(index)}
                              className={`px-2 py-1 font-bold uppercase rounded border border-solid transition-all ${
                                isEnabled
                                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              }`}
                            >
                              {isEnabled ? "Enabled" : "Disabled"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-textColor italic text-center py-12">
                    No time slots configured. Add slots on the left.
                  </p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-gray-50 border-t border-solid border-gray-100 shrink-0 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="px-5 py-2.5 border border-solid border-gray-300 text-textColor hover:bg-gray-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                disabled={savingSlots}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSlots}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center min-w-[120px]"
                disabled={savingSlots}
              >
                {savingSlots ? "Saving..." : "Save Schedule"}
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};

export default SchedulesManagement;
