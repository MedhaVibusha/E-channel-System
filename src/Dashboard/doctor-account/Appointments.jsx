import React, { useState } from 'react';
import { dateFormat } from '../../../utils/dateFormat';
import convertTime from '../../../utils/convertTime';
import { AiOutlineUser, AiOutlineCalendar, AiOutlineClockCircle, AiOutlineCheckCircle, AiOutlineSearch } from 'react-icons/ai';

const Appointments = ({ appointments, onSelectPatient }) => {
  const [filter, setFilter] = useState("all"); // all, today, upcoming, completed
  const [searchTerm, setSearchTerm] = useState("");

  const validAppointments = appointments?.filter(item => item.user !== null) || [];

  // Date check helpers
  const isToday = (dateVal) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const isUpcoming = (dateVal, status) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today && status !== "Completed" && status !== "Cancelled";
  };

  // Stats calculation
  const todayAppointments = validAppointments.filter(item => isToday(item.appointmentDate));
  const upcomingAppointments = validAppointments.filter(item => isUpcoming(item.appointmentDate, item.status) && !isToday(item.appointmentDate));
  const completedAppointments = validAppointments.filter(item => item.status === "Completed");

  // Dynamic queue status today (e.g. how many patients booked for active slots)
  const todayBookedCount = todayAppointments.length;

  // Filtered appointments
  const filteredAppointments = validAppointments.filter(item => {
    // Apply tab filter
    if (filter === "today" && !isToday(item.appointmentDate)) return false;
    if (filter === "upcoming" && (!isUpcoming(item.appointmentDate, item.status) || isToday(item.appointmentDate))) return false;
    if (filter === "completed" && item.status !== "Completed" && item.status !== "Cancelled") return false;

    // Apply search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const patientName = item.user?.name?.toLowerCase() || "";
      const aptId = item.appointmentId?.toLowerCase() || "";
      return patientName.includes(term) || aptId.includes(term);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* 📊 Overview Stats Grid (Standard White Cards with subtle accent highlights) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Today's Bookings */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4.5 transition-all duration-300 hover:shadow-md hover:border-blue-100 hover:scale-[1.01] transform">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl shrink-0">
            <AiOutlineCalendar className="text-[26px]" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-textColor block tracking-wider">Today's Bookings</span>
            <span className="text-[26px] font-black text-headingColor mt-0.5 block font-mono leading-none">{todayAppointments.length}</span>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4.5 transition-all duration-300 hover:shadow-md hover:border-amber-100 hover:scale-[1.01] transform">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl shrink-0">
            <AiOutlineClockCircle className="text-[26px]" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-textColor block tracking-wider">Upcoming</span>
            <span className="text-[26px] font-black text-headingColor mt-0.5 block font-mono leading-none">{upcomingAppointments.length}</span>
          </div>
        </div>

        {/* Completed Visits */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4.5 transition-all duration-300 hover:shadow-md hover:border-purple-100 hover:scale-[1.01] transform">
          <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl shrink-0">
            <AiOutlineUser className="text-[26px]" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-textColor block tracking-wider">Today's Patients</span>
            <span className="text-[26px] font-black text-headingColor mt-0.5 block font-mono leading-none">{todayBookedCount}</span>
          </div>
        </div>

        {/* Queue Occupancy */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4.5 transition-all duration-300 hover:shadow-md hover:border-emerald-100 hover:scale-[1.01] transform">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl shrink-0">
            <AiOutlineCheckCircle className="text-[26px]" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-textColor block tracking-wider">Queue Capacity</span>
            <span className="text-[26px] font-black text-headingColor mt-0.5 block font-mono leading-none">
              {todayBookedCount > 0 ? `${todayBookedCount}/20` : "0/20"}
            </span>
          </div>
        </div>

      </div>

      {/* 📅 Premium Top Tab Navigation (Positioned below the cards, search bar removed) */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex">
        {/* Tab Items */}
        <div className="flex bg-gray-100/80 p-1 rounded-lg overflow-x-auto w-full">
          {[
            { id: "today", label: "Today's Appointments", count: todayAppointments.length },
            { id: "upcoming", label: "Upcoming Appointments", count: upcomingAppointments.length },
            { id: "completed", label: "Completed / Cancelled", count: completedAppointments.length },
            { id: "all", label: "All Bookings", count: validAppointments.length },
          ].map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setFilter(tabItem.id)}
              className={`flex-1 px-4 py-2.5 text-[11px] font-bold rounded-md transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${
                filter === tabItem.id
                  ? "bg-white text-primaryColor shadow-sm"
                  : "bg-transparent text-textColor hover:text-headingColor"
              }`}
            >
              <span>{tabItem.label}</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                filter === tabItem.id 
                  ? "bg-primaryColor text-white" 
                  : "bg-gray-200 text-textColor"
              }`}>
                {tabItem.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 📅 Appointment List Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th scope="col" className="px-6 py-4">Appointment ID</th>
                <th scope="col" className="px-6 py-4">Patient</th>
                <th scope="col" className="px-6 py-4">Appointment Date & Time</th>
                <th scope="col" className="px-6 py-4 text-center">Queue Position</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((item) => {
                  let statusColor = "bg-yellow-50 text-yellow-700 border-yellow-100";
                  if (item.status === "Completed") statusColor = "bg-green-50 text-green-700 border-green-100";
                  if (item.status === "Cancelled" || item.status === "Cancelled") statusColor = "bg-red-50 text-red-700 border-red-100";
                  if (item.status === "Confirmed") statusColor = "bg-blue-50 text-blue-700 border-blue-100";

                  return (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      {/* Appointment ID */}
                      <td className="px-6 py-4 font-mono font-bold text-xs text-primaryColor">
                        {item.appointmentId || "N/A"}
                      </td>

                      {/* Patient Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.user?.photo ? (
                            <img
                              src={item.user.photo}
                              className="w-10 h-10 rounded-full object-cover border border-gray-100"
                              alt=""
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-bold border border-gray-200">
                              {item.user?.name ? item.user.name.substring(0, 2).toUpperCase() : "PT"}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-headingColor">{item.user?.name || "Unknown Patient"}</div>
                            <div className="text-[11px] text-textColor">{item.user?.gender || "N/A"} • {item.user?.age || "N/A"} yrs</div>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time Slot */}
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-gray-700">
                          {dateFormat(item.appointmentDate || item.createdAt)}
                        </div>
                        {item.appointmentTime ? (
                          <div className="text-[11px] text-textColor flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                              {convertTime(item.appointmentTime.startingTime)} - {convertTime(item.appointmentTime.endingTime)}
                            </span>
                            {item.consultationTime && (
                              <span className="text-primaryColor font-medium">
                                (Est: {item.consultationTime})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-textColor">General Visit</span>
                        )}
                      </td>

                      {/* Queue Position */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono">
                          #{item.bookingNumber || "1"}/20
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColor}`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onSelectPatient(item)}
                          className="bg-primaryColor hover:bg-[#0052cc] text-white px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Select for EMR
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-textColor text-xs italic">
                    No appointments found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Appointments;