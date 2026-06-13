import React, { useState } from "react";
import { BASE_URL } from "../../config";
import { toast } from "react-toastify";
import { AiOutlineDelete, AiOutlinePlus, AiOutlineSave, AiOutlineClockCircle } from "react-icons/ai";
import convertTime from "../../../utils/convertTime";

const ScheduleManagement = ({ doctorData, onScheduleUpdated }) => {
  const [timeSlots, setTimeSlots] = useState(doctorData?.timeSlots || []);
  const [newDay, setNewDay] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [saving, setSaving] = useState(false);

  // Helper to count active patients booked in a slot
  const getPatientCountForSlot = (slot) => {
    if (!doctorData?.appointments) return 0;
    return doctorData.appointments.filter((apt) => {
      // Must not be cancelled
      if (apt.status === "Cancelled") return false;
      
      const aptSlot = apt.appointmentTime;
      if (!aptSlot) return false;
      
      return (
        aptSlot.day?.toLowerCase() === slot.day?.toLowerCase() &&
        aptSlot.startingTime === slot.startingTime &&
        aptSlot.endingTime === slot.endingTime
      );
    }).length;
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!newDay || !newStart || !newEnd) {
      toast.error("Please fill in all slot fields");
      return;
    }

    // Check for duplicates
    const isDuplicate = timeSlots.some(
      (slot) =>
        slot.day.toLowerCase() === newDay.toLowerCase() &&
        slot.startingTime === newStart &&
        slot.endingTime === newEnd
    );

    if (isDuplicate) {
      toast.error("This time slot already exists");
      return;
    }

    const updatedSlots = [
      ...timeSlots,
      {
        day: newDay,
        startingTime: newStart,
        endingTime: newEnd,
        enabled: true, // Default to enabled
      },
    ];

    setTimeSlots(updatedSlots);
    setNewDay("");
    setNewStart("");
    setNewEnd("");
    toast.success("Time slot added locally. Click 'Save Schedule' to apply.");
  };

  const handleDeleteSlot = (indexToDelete) => {
    // Check if there are active bookings in this slot
    const slot = timeSlots[indexToDelete];
    const bookingsCount = getPatientCountForSlot(slot);
    if (bookingsCount > 0) {
      if (!window.confirm(`Warning: There are ${bookingsCount} patient bookings in this session. Are you sure you want to delete this slot?`)) {
        return;
      }
    }

    const updatedSlots = timeSlots.filter((_, idx) => idx !== indexToDelete);
    setTimeSlots(updatedSlots);
    toast.success("Time slot removed locally. Click 'Save Schedule' to apply.");
  };

  const handleToggleSlot = (index) => {
    const updatedSlots = [...timeSlots];
    // Toggle the enabled status. If undefined, set to false (since undefined defaults to enabled)
    updatedSlots[index].enabled = updatedSlots[index].enabled !== false ? false : true;
    setTimeSlots(updatedSlots);
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/doctors/${doctorData._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          timeSlots,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to update schedule");
      }

      toast.success("Schedule successfully saved!");
      if (onScheduleUpdated) {
        onScheduleUpdated();
      }
    } catch (err) {
      toast.error(err.message || "An error occurred while saving the schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-[18px] font-bold text-headingColor">Schedule Management</h3>
          <p className="text-xs text-textColor mt-1">
            Create weekly sessions, enable/disable bookings, and monitor session patient bookings (Max 20 patients per slot).
          </p>
        </div>
        <button
          onClick={handleSaveSchedule}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:bg-emerald-300"
        >
          {saving ? (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <AiOutlineSave className="text-[16px]" />
          )}
          Save Schedule Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Add New Slot (4/12) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit space-y-4">
          <h4 className="text-[15px] font-bold text-headingColor border-b border-gray-100 pb-2">
            Create Time Slot
          </h4>
          <form onSubmit={handleAddSlot} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase text-headingColor block mb-1">
                Day of Week
              </label>
              <select
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                required
                className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primaryColor text-headingColor"
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
              <label className="text-[11px] font-bold uppercase text-headingColor block mb-1">
                Starting Time
              </label>
              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                required
                className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primaryColor text-headingColor"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-headingColor block mb-1">
                Ending Time
              </label>
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                required
                className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primaryColor text-headingColor"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primaryColor hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <AiOutlinePlus className="text-[14px]" /> Add Locally
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Active Time Slots (8/12) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h4 className="text-[15px] font-bold text-headingColor border-b border-gray-100 pb-2">
            Active Scheduling Sessions ({timeSlots.length})
          </h4>

          {timeSlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timeSlots.map((slot, index) => {
                const count = getPatientCountForSlot(slot);
                const isEnabled = slot.enabled !== false;

                return (
                  <div
                    key={index}
                    className={`border rounded-xl p-4.5 space-y-3.5 transition-all shadow-sm ${
                      isEnabled
                        ? "bg-white border-gray-100 hover:border-gray-200"
                        : "bg-gray-50/70 border-gray-200 opacity-75"
                    }`}
                  >
                    {/* Day and Delete */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-headingColor capitalize text-sm">
                        {slot.day}
                      </span>
                      <button
                        onClick={() => handleDeleteSlot(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete slot"
                      >
                        <AiOutlineDelete className="text-[16px]" />
                      </button>
                    </div>

                    {/* Time details */}
                    <div className="flex items-center gap-2 text-xs text-textColor">
                      <AiOutlineClockCircle className="text-[15px]" />
                      <span>
                        {convertTime(slot.startingTime)} - {convertTime(slot.endingTime)}
                      </span>
                    </div>

                    {/* Booking Stats and Availability Toggles */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1 text-xs">
                      <div>
                        <span className="text-[10px] text-textColor block uppercase">Booked Count</span>
                        <span className={`font-bold block mt-0.5 ${count >= 20 ? "text-red-500 font-extrabold" : "text-headingColor"}`}>
                          {count} / 20 Patients
                        </span>
                      </div>
                      
                      {/* Toggle button */}
                      <button
                        onClick={() => handleToggleSlot(index)}
                        className={`px-3 py-1.5 font-bold text-[10px] uppercase rounded-lg border transition-all ${
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
            <p className="text-xs text-textColor italic text-center py-10">
              No time slots set yet. Please use the form on the left to set available days and times.
            </p>
          )}
        </div>

      </div>

    </div>
  );
};

export default ScheduleManagement;
