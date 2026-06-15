import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "../config";
import Loading from "../components/Loader/Loading";
import Error from "../components/Error/Error";
import convertTime from "../../utils/convertTime";
import { dateFormat } from "../../utils/dateFormat";

export default function CheckoutSuccess() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");
  const idOrSessionId = bookingId || sessionId;

  useEffect(() => {
    if (idOrSessionId) {
      const fetchReceipt = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${BASE_URL}/bookings/receipt/${idOrSessionId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const result = await res.json();
          if (!res.ok) {
            throw new Error(result.message || "Failed to load receipt");
          }
          setBooking(result.data);
        } catch (err) {
          console.error(err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchReceipt();
    } else {
      setLoading(false);
    }
  }, [idOrSessionId]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loading /></div>;
  if (error) return <div className="h-screen flex items-center justify-center"><Error errorMsg={error} /></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-solid border-gray-100">
        
        {/* Receipt Header Badge */}
        <div className="bg-primaryColor px-8 py-8 text-center text-white relative">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center text-primaryColor shadow-md mb-4">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-sans">Booking Confirmed!</h2>
          <p className="mt-1 text-blue-100 text-sm sm:text-base font-sans">
            Your appointment has been successfully scheduled.
          </p>
        </div>

        {booking ? (
          <div className="p-6 sm:p-8">
            
            {/* Appointment Details List */}
            <div className="space-y-4 font-sans">
              
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 space-y-4 border border-solid border-gray-100">
                
                <div className="flex justify-between items-center border-b border-solid border-gray-200 pb-3">
                  <span className="text-textColor font-medium">Appointment ID:</span>
                  <span className="font-mono font-bold text-headingColor text-base sm:text-lg text-primaryColor bg-[#0066ff0d] px-3 py-1 rounded-md">
                    {booking.appointmentId}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-solid border-gray-200 pb-3">
                  <span className="text-textColor font-medium">Patient Name:</span>
                  <span className="font-bold text-headingColor text-sm sm:text-base">
                    {booking.user?.name || "N/A"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-solid border-gray-200 pb-3">
                  <span className="text-textColor font-medium">Doctor Name:</span>
                  <span className="font-bold text-headingColor text-sm sm:text-base">
                    {booking.doctor?.name || "Dr. Unknown"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-solid border-gray-200 pb-3">
                  <span className="text-textColor font-medium">Specialization:</span>
                  <span className="inline-block text-xs font-semibold text-irisBlueColor bg-[#CCF0F3] px-2.5 py-1 rounded">
                    {booking.doctor?.specialization ? booking.doctor.specialization.charAt(0).toUpperCase() + booking.doctor.specialization.slice(1) : "N/A"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-solid border-gray-200 pb-3">
                  <span className="text-textColor font-medium">Appointment Date:</span>
                  <span className="font-bold text-headingColor text-sm sm:text-base">
                    {booking.appointmentDate ? dateFormat(booking.appointmentDate) : "N/A"}{" "}
                    <span className="text-xs text-textColor font-normal italic">
                      ({booking.appointmentTime?.day ? booking.appointmentTime.day.charAt(0).toUpperCase() + booking.appointmentTime.day.slice(1) : ""})
                    </span>
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-solid border-gray-200 pb-3">
                  <span className="text-textColor font-medium">Time Slot:</span>
                  <span className="font-bold text-headingColor text-sm sm:text-base">
                    {booking.appointmentTime
                      ? `${convertTime(booking.appointmentTime.startingTime)} - ${convertTime(booking.appointmentTime.endingTime)}`
                      : "N/A"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-solid border-gray-200 pb-3">
                  <span className="text-textColor font-medium">Queue Position:</span>
                  <span className="font-black text-headingColor text-base text-yellow-600 bg-yellow-50 border border-solid border-yellow-100 px-3 py-1 rounded-md">
                    {booking.bookingNumber || "1"}/20
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-solid border-gray-200 pb-3">
                  <span className="text-textColor font-medium">Consult Time:</span>
                  <span className="font-bold text-primaryColor bg-primaryColor/5 px-3 py-1 rounded-md text-sm sm:text-base">
                    {booking.consultationTime || "Pending Slot Allocation"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-1">
                  <span className="text-textColor font-medium">Booking Status:</span>
                  <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    booking.status === "Approved" || booking.status === "Confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {booking.status}
                  </span>
                </div>

              </div>

              {/* Payment Receipt reference (if exists) */}
              {booking.ticketPrice !== "0" && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-5 text-xs text-textColor border border-solid border-gray-100">
                  <div className="flex justify-between mb-1.5">
                    <span>Ticket Price:</span>
                    <span className="font-semibold text-headingColor">{booking.ticketPrice} LKR</span>
                  </div>
                  {booking.paymentId && (
                    <div className="flex justify-between items-center pt-1.5 border-t border-solid border-gray-100">
                      <span>Payment Reference ID:</span>
                      <span className="font-mono text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded">{booking.paymentId}</span>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Receipt Footer */}
            <div className="mt-8 pt-6 border-t border-solid border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between font-sans">
              <Link
                to="/users/profile/me"
                className="w-full sm:w-auto text-center px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-headingColor text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Go to My Bookings
              </Link>
              <Link
                to="/home"
                className="w-full sm:w-auto text-center px-6 py-2.5 bg-primaryColor hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-md shadow-blue-100 cursor-pointer"
              >
                Back to Home Page
              </Link>
            </div>

          </div>
        ) : (
          <div className="p-8 text-center font-sans">
            <p className="text-gray-600 my-2">
              Thanks for booking with Life HealthCare. We hope you have a great day!
            </p>
            <div className="py-8">
              <Link
                to="/home"
                className="px-12 text-white bg-primaryColor hover:bg-blue-700 font-semibold py-3 rounded-lg shadow-md transition-colors"
              >
                Go back to home page
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
