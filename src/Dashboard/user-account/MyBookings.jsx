import React, { useState } from "react";
import useFetchData from "../../hooks/useFetchData";
import Loading from "../../components/Loader/Loading";
import Error from "../../components/Error/Error";
import { BASE_URL } from "../../config";
import convertTime from "../../../utils/convertTime";
import { dateFormat } from "../../../utils/dateFormat";
import { AiOutlineClose, AiOutlineFile } from "react-icons/ai";

const MyBookings = () => {
  const {
    data: bookings,
    loading,
    error,
    refetch,
  } = useFetchData(`${BASE_URL}/users/appointments/my-appointments`);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [editForm, setEditForm] = useState({
    appointmentId: "",
    paymentId: "",
    ticketPrice: "",
    bookingNumber: "",
    consultationTime: "",
    status: "",
    appointmentDate: "",
    updateAllBookingsInSession: true,
  });

  const handleEditClick = (booking) => {
    setEditForm({
      appointmentId: booking.appointmentId || "",
      paymentId: booking.paymentId || "",
      ticketPrice: booking.ticketPrice || "",
      bookingNumber: booking.bookingNumber || "",
      consultationTime: booking.consultationTime || "",
      status: booking.status || "Pending",
      appointmentDate: booking.appointmentDate ? new Date(booking.appointmentDate).toISOString().split('T')[0] : "",
      updateAllBookingsInSession: true,
    });
    setSaveError(null);
    setIsEditing(true);
  };

  const handlePrintReceipt = (booking) => {
    let iframe = document.getElementById("receipt-print-iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "receipt-print-iframe";
      iframe.style.position = "absolute";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "none";
      document.body.appendChild(iframe);
    }
    
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const formattedDate = booking.appointmentDate 
      ? new Date(booking.appointmentDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
      : "N/A";
    const dayName = booking.appointmentDate
      ? daysOfWeek[new Date(booking.appointmentDate).getDay()]
      : (booking.appointmentTime?.day ? booking.appointmentTime.day.charAt(0).toUpperCase() + booking.appointmentTime.day.slice(1) : "N/A");

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${booking.appointmentId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 40px;
              color: #334155;
              background-color: #fff;
            }
            .receipt-container {
              max-width: 650px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 24px;
              margin-bottom: 30px;
            }
            .logo-icon {
              width: 48px;
              height: 48px;
              background-color: #3b82f6;
              color: white;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px;
              font-size: 24px;
              font-weight: 800;
            }
            .hospital-name {
              font-size: 22px;
              font-weight: 800;
              color: #1e3a8a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .subtitle {
              font-size: 13px;
              color: #64748b;
              margin-top: 6px;
              line-height: 1.5;
            }
            .receipt-title {
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 14px;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 30px;
            }
            .meta-box {
              background-color: #f8fafc;
              border-radius: 12px;
              padding: 20px;
              border: 1px solid #f1f5f9;
            }
            .meta-box h4 {
              margin: 0 0 12px 0;
              color: #475569;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 1px;
              font-weight: 700;
            }
            .meta-item {
              margin-bottom: 8px;
              font-size: 13px;
              display: flex;
              justify-content: space-between;
            }
            .meta-item:last-child {
              margin-bottom: 0;
            }
            .meta-label {
              color: #64748b;
              font-weight: 500;
            }
            .meta-value {
              color: #0f172a;
              font-weight: 600;
              text-align: right;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 13px;
            }
            .details-table th {
              background-color: #f8fafc;
              text-align: left;
              padding: 12px 16px;
              color: #475569;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 11px;
              border-bottom: 2px solid #e2e8f0;
            }
            .details-table td {
              padding: 16px;
              border-bottom: 1px solid #e2e8f0;
              color: #334155;
            }
            .amount-box {
              background-color: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 12px;
              padding: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
            }
            .amount-label {
              font-size: 13px;
              color: #166534;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .amount-value {
              font-size: 24px;
              font-weight: 900;
              color: #15803d;
            }
            .footer-text {
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px dashed #e2e8f0;
              padding-top: 24px;
              line-height: 1.6;
            }
            @media print {
              body {
                padding: 0;
                background-color: #fff;
              }
              .receipt-container {
                border: none;
                box-shadow: none;
                padding: 0;
                max-width: 100%;
              }
              @page {
                margin: 15mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="logo-icon">+</div>
              <div class="hospital-name">Lifehealthcare Medical Center</div>
              <div class="subtitle">Weliweriya • Contact: +94 11 234 5678 • support@lifehealthcare.com</div>
              <div class="receipt-title">Consultation Payment Receipt</div>
            </div>
            
            <div class="meta-grid">
              <div class="meta-box">
                <h4>Patient Information</h4>
                <div class="meta-item"><span class="meta-label">Name:</span> <span class="meta-value">${booking.user?.name || "N/A"}</span></div>
                <div class="meta-item"><span class="meta-label">Email:</span> <span class="meta-value">${booking.user?.email || "N/A"}</span></div>
                <div class="meta-item"><span class="meta-label">Contact:</span> <span class="meta-value">${booking.user?.phone || "N/A"}</span></div>
              </div>
              <div class="meta-box">
                <h4>Receipt Details</h4>
                <div class="meta-item"><span class="meta-label">Appointment ID:</span> <span class="meta-value" style="font-family: monospace; font-weight: bold;">${booking.appointmentId || "APT-Pending"}</span></div>
                <div class="meta-item"><span class="meta-label">Payment ID:</span> <span class="meta-value" style="font-family: monospace;">${booking.paymentId || "PAY-Pending"}</span></div>
                <div class="meta-item"><span class="meta-label">Status:</span> <span class="meta-value" style="color:#16a34a; font-weight: bold;">${booking.status}</span></div>
              </div>
            </div>
            
            <table class="details-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Session Date & Day</th>
                  <th>Session Time Slot</th>
                  <th>Queue Position</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${booking.doctor?.name || "Dr. Unknown"}</strong></td>
                  <td>${booking.doctor?.specialization ? booking.doctor.specialization.charAt(0).toUpperCase() + booking.doctor.specialization.slice(1) : "N/A"}</td>
                  <td>
                    ${formattedDate}
                    <br>
                    <span style="font-size: 11px; color: #64748b; font-style: italic;">
                      (${dayName})
                    </span>
                  </td>
                  <td>${booking.appointmentTime ? `${booking.appointmentTime.startingTime} - ${booking.appointmentTime.endingTime}` : "N/A"}</td>
                  <td><span style="font-weight: 800;">#${booking.bookingNumber || "1"}</span></td>
                </tr>
              </tbody>
            </table>
            
            <div class="amount-box">
              <span class="amount-label">Total Amount Paid</span>
              <span class="amount-value">${booking.ticketPrice === "0" ? "Free of Charge" : `${booking.ticketPrice} LKR`}</span>
            </div>
            
            <div class="footer-text">
              This is an official computer-generated receipt for consultation fees paid via SabraCare.<br>
              No physical signature is required. For any inquiries, please contact Lifehealthcare Weliweriya.<br>
              <strong>Thank you for choosing us!</strong>
            </div>
          </div>
        </body>
      </html>
    `;
    
    doc.open();
    doc.write(receiptHtml);
    doc.close();
    
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 500);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/bookings/${selectedBooking._id}/receipt`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message);
      }
      setSelectedBooking(result.data);
      setIsEditing(false);
      refetch();
    } catch (err) {
      setSaveError(err.message || "Failed to update receipt");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="mt-5 font-sans">
      {loading && !error && <Loading />}
      {error && !loading && <Error errorMsg={error} />}

      {!loading && !error && bookings && bookings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-headingColor font-bold text-[20px] leading-7 mb-4">
            My Appointments History ({bookings.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white border border-solid border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Appointment ID Header */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="font-mono font-bold text-sm text-primaryColor bg-[#0066ff0d] px-3 py-1 rounded-md">
                      {booking.appointmentId}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      booking.status === "Approved" || booking.status === "Confirmed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex items-start gap-3.5 mb-4">
                    {booking.doctor?.photo ? (
                      <figure className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                        <img
                          src={booking.doctor.photo}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </figure>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                        Dr.
                      </div>
                    )}
                    <div>
                      <h4 className="text-[16px] leading-6 font-bold text-headingColor">
                        {booking.doctor?.name || "Dr. Unknown"}
                      </h4>
                      {booking.doctor?.specialization && (
                        <span className="inline-block text-xs text-irisBlueColor bg-[#CCF0F3] px-2 py-0.5 rounded font-medium">
                          {booking.doctor.specialization.charAt(0).toUpperCase() + booking.doctor.specialization.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Appointment Schedule */}
                  <div className="space-y-1.5 text-sm mb-4 border-t border-solid border-gray-50 pt-3">
                    <div className="flex justify-between">
                      <span className="text-textColor">Session Date:</span>
                      <span className="font-semibold text-headingColor">
                        {booking.appointmentDate ? dateFormat(booking.appointmentDate) : "N/A"}{" "}
                        <span className="text-xs text-textColor font-normal italic">
                          ({booking.appointmentTime?.day ? booking.appointmentTime.day.charAt(0).toUpperCase() + booking.appointmentTime.day.slice(1) : ""})
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textColor">Session Slot:</span>
                      <span className="font-semibold text-headingColor">
                        {booking.appointmentTime
                          ? `${convertTime(booking.appointmentTime.startingTime)} - ${convertTime(booking.appointmentTime.endingTime)}`
                          : "N/A"}
                      </span>
                    </div>
                    
                    {/* FIFO Queue Position & Consultation Time */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-solid border-gray-50">
                      <div className="bg-yellow-50/50 border border-solid border-yellow-100/50 p-2 rounded text-center">
                        <p className="text-[10px] text-yellow-800 font-bold uppercase tracking-wider">Queue Position</p>
                        <p className="font-bold text-sm text-yellow-900 mt-0.5">#{booking.bookingNumber || "1"}</p>
                      </div>
                      <div className="bg-primaryColor/5 border border-solid border-primaryColor/10 p-2 rounded text-center">
                        <p className="text-[10px] text-textColor font-bold uppercase tracking-wider">Consult Time</p>
                        <p className="font-bold text-sm text-primaryColor mt-0.5">{booking.consultationTime || "Pending"}</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Card Action */}
                <button
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full mt-2 py-2 px-4 border border-solid border-primaryColor hover:bg-primaryColor hover:text-white text-primaryColor font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AiOutlineFile className="text-base" />
                  View Receipt
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && bookings && bookings.length === 0 && (
        <div className="text-center py-10">
          <h2 className="text-center leading-7 text-[20px] font-semibold text-primaryColor">
            You have no bookings yet
          </h2>
          <p className="text-textColor text-sm mt-2">
            Schedule an appointment with one of our doctors to get started.
          </p>
        </div>
      )}

      {/* 🧾 RENDER DETAILED RECEIPT DIALOG MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-area, #printable-area * {
                visibility: visible !important;
              }
              #printable-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
              }
              #printable-area .overflow-y-auto {
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
              }
            }
          `}</style>
          
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-solid border-gray-100 relative max-h-[90vh] flex flex-col">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedBooking(null);
                setIsEditing(false);
              }}
              className="absolute top-4 right-4 z-10 p-1.5 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors cursor-pointer"
              title="Close Receipt"
            >
              <AiOutlineClose className="text-lg" />
            </button>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0">
                {/* Modal Header for Editing */}
                <div className="bg-primaryColor px-6 py-6 text-center text-white shrink-0">
                  <h3 className="text-xl font-bold tracking-tight font-sans">Edit Receipt Details</h3>
                  <p className="text-blue-100 text-xs mt-1 font-sans">Update booking and payment details below</p>
                </div>

                {/* Modal Edit Form Content */}
                <div className="p-6 overflow-y-auto space-y-4 font-sans flex-1">
                  {saveError && (
                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-solid border-red-100">
                      {saveError}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-textColor uppercase tracking-wider mb-1">Appointment ID</label>
                      <input
                        type="text"
                        value={editForm.appointmentId}
                        onChange={(e) => setEditForm({ ...editForm, appointmentId: e.target.value })}
                        className="w-full px-3 py-2 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-sm font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-textColor uppercase tracking-wider mb-1">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-sm font-semibold bg-white cursor-pointer"
                        required
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="No Show">No Show</option>
                        <option value="Rescheduled">Rescheduled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-textColor uppercase tracking-wider mb-1">Queue Position</label>
                      <input
                        type="number"
                        value={editForm.bookingNumber}
                        onChange={(e) => setEditForm({ ...editForm, bookingNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-sm font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-textColor uppercase tracking-wider mb-1">Consultation Time</label>
                      <input
                        type="text"
                        value={editForm.consultationTime}
                        onChange={(e) => setEditForm({ ...editForm, consultationTime: e.target.value })}
                        className="w-full px-3 py-2 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-sm font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-textColor uppercase tracking-wider mb-1">Ticket Price (LKR)</label>
                      <input
                        type="text"
                        value={editForm.ticketPrice}
                        onChange={(e) => setEditForm({ ...editForm, ticketPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-sm font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-textColor uppercase tracking-wider mb-1">Payment ID</label>
                      <input
                        type="text"
                        value={editForm.paymentId}
                        onChange={(e) => setEditForm({ ...editForm, paymentId: e.target.value })}
                        className="w-full px-3 py-2 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-sm font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-textColor uppercase tracking-wider mb-1">Session Date</label>
                      <input
                        type="date"
                        value={editForm.appointmentDate}
                        onChange={(e) => setEditForm({ ...editForm, appointmentDate: e.target.value })}
                        className="w-full px-3 py-2 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-sm font-semibold"
                        required
                      />
                    </div>
                    <div className="flex items-center mt-5">
                      <label className="flex items-center gap-2 text-xs font-semibold text-textColor cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editForm.updateAllBookingsInSession}
                          onChange={(e) => setEditForm({ ...editForm, updateAllBookingsInSession: e.target.checked })}
                          className="w-4 h-4 text-primaryColor border-solid border-gray-300 rounded focus:ring-primaryColor cursor-pointer"
                        />
                        Update date for all bookings in this slot
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-textColor font-semibold">Patient Name:</span>
                      <span className="font-bold text-headingColor">{selectedBooking.user?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textColor font-semibold">Doctor Name:</span>
                      <span className="font-bold text-headingColor">{selectedBooking.doctor?.name || "Dr. Unknown"}</span>
                    </div>
                  </div>
                </div>

                {/* Modal Edit Action Footer */}
                <div className="p-5 bg-gray-50 border-t border-solid border-gray-100 shrink-0 flex justify-end items-center gap-2 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2 border border-solid border-gray-300 text-textColor hover:bg-gray-100 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    disabled={saveLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primaryColor hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center min-w-[120px]"
                    disabled={saveLoading}
                  >
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div id="printable-area" className="flex flex-col flex-1 min-h-0">
                  {/* Modal Header */}
                  <div className="bg-primaryColor px-6 py-6 text-center text-white shrink-0">
                    <h2 className="text-[15px] font-bold tracking-wider uppercase mb-1 font-sans">Lifehealthcare Medical Center, Weliweriya</h2>
                    <h3 className="text-xl font-bold tracking-tight font-sans">Consultation Invoice</h3>
                    <p className="text-blue-100 text-xs mt-1 font-sans">SabraCare Medical Booking Confirmation</p>
                  </div>

                  {/* Modal Scrollable Receipt Content */}
                  <div className="p-6 overflow-y-auto space-y-4 font-sans flex-1">
                    
                    {/* Appointment Code Header */}
                    <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3 mb-1 gap-2">
                      <div>
                        <p className="text-[10px] text-textColor font-bold uppercase tracking-wider">Appointment ID</p>
                        <p className="text-lg font-black text-primaryColor font-mono leading-tight">
                          {selectedBooking.appointmentId || "APT-Pending"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-textColor font-bold uppercase tracking-wider">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          selectedBooking.status === "Approved" || selectedBooking.status === "Confirmed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {selectedBooking.status}
                        </span>
                      </div>
                    </div>

                    {/* Receipt Ticket Details */}
                    <div className="space-y-3.5">
                      
                      {/* FIFO Queue Position & Consultation Time */}
                      <div className="bg-yellow-50 border border-solid border-yellow-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-yellow-800 font-bold uppercase tracking-wider">Queue Position</p>
                          <p className="text-xl font-black text-yellow-900 mt-0.5">
                            #{selectedBooking.bookingNumber || "1"} <span className="text-xs font-semibold text-yellow-700">/ 20 Patients</span>
                          </p>
                          <p className="text-[9px] text-yellow-700 mt-1 max-w-xs">
                            *Consultations are conducted in FIFO order.
                          </p>
                        </div>
                        <div className="bg-white border border-solid border-yellow-100 rounded-xl p-3 sm:text-right shrink-0">
                          <p className="text-[10px] text-textColor font-bold uppercase tracking-wider">Consultation Time</p>
                          <p className="text-lg font-black text-primaryColor mt-0.5">
                            {selectedBooking.consultationTime || "Slot Pending"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3.5 rounded-xl">
                          <p className="text-[11px] text-textColor font-semibold uppercase">Patient Name</p>
                          <p className="text-sm font-bold text-headingColor mt-0.5">
                            {selectedBooking.user?.name || "N/A"}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3.5 rounded-xl">
                          <p className="text-[11px] text-textColor font-semibold uppercase">Doctor Name</p>
                          <p className="text-sm font-bold text-headingColor mt-0.5">
                            {selectedBooking.doctor?.name || "Dr. Unknown"}
                          </p>
                          {selectedBooking.doctor?.specialization && (
                            <span className="inline-block mt-0.5 text-[10px] text-irisBlueColor bg-[#CCF0F3] px-1.5 py-0.5 rounded font-medium">
                              {selectedBooking.doctor.specialization.charAt(0).toUpperCase() + selectedBooking.doctor.specialization.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3.5 rounded-xl">
                          <p className="text-[11px] text-textColor font-semibold uppercase">Session Date</p>
                          <p className="text-sm font-bold text-headingColor mt-0.5">
                            {selectedBooking.appointmentDate ? dateFormat(selectedBooking.appointmentDate) : "N/A"}
                          </p>
                          <span className="inline-block mt-0.5 text-[10px] text-textColor font-medium italic">
                            ({selectedBooking.appointmentTime?.day ? selectedBooking.appointmentTime.day.charAt(0).toUpperCase() + selectedBooking.appointmentTime.day.slice(1) : "N/A"})
                          </span>
                        </div>
                        <div className="bg-gray-50 p-3.5 rounded-xl">
                          <p className="text-[11px] text-textColor font-semibold uppercase">Session Time Slot</p>
                          <p className="text-sm font-bold text-headingColor mt-0.5 leading-tight">
                            {selectedBooking.appointmentTime
                              ? `${convertTime(selectedBooking.appointmentTime.startingTime)} - ${convertTime(selectedBooking.appointmentTime.endingTime)}`
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Payment Box */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="text-[11px] font-bold text-headingColor uppercase tracking-wider mb-2">Payment Info</h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-textColor">Ticket Price:</span>
                            <span className="font-semibold text-headingColor">
                              {selectedBooking.ticketPrice === "0" ? "Free of Charge" : `${selectedBooking.ticketPrice} LKR`}
                            </span>
                          </div>
                          <div className="flex flex-col pt-1.5 border-t border-solid border-gray-200 mt-1.5 gap-1">
                            <span className="text-textColor">Payment ID:</span>
                            <span className="font-mono text-sm font-bold text-primaryColor select-all bg-primaryColor/5 px-2 py-0.5 rounded mt-0.5">
                              {selectedBooking.paymentId || "PAY-Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Modal Action Footer */}
                <div className="p-5 bg-gray-50 border-t border-solid border-gray-100 shrink-0 flex items-center justify-between font-sans">
                  <button
                    onClick={() => handleEditClick(selectedBooking)}
                    className="px-4 py-2 border border-solid border-primaryColor text-primaryColor hover:bg-primaryColor hover:text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Edit Receipt
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintReceipt(selectedBooking)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Print Receipt
                    </button>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="px-5 py-2 bg-primaryColor hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookings;
