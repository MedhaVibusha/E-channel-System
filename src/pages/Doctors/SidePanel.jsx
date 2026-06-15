import convertTime from "../../../utils/convertTime";
import { BASE_URL } from "../../config.js";
import { toast } from "react-toastify";
import { useState } from "react";

const SidePanel = ({ doctorId, ticketPrice, timeSlots, specialization, scheduleStatus }) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const user = localStorage.getItem("user");
  const role = localStorage.getItem("role");

  const bookingHandler = async (bypassPayment) => {
    try {
      if (!selectedTimeSlot) {
        toast.error("Please select a time slot for your appointment");
        return;
      }
      // const userId = localStorage.getItem("userId");
      const userId = JSON.parse(user)._id;
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BASE_URL}/bookings/checkout-session/${doctorId}/${userId}`,
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ appointmentTime: selectedTimeSlot, bypassPayment })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (data.isGeneralPhysician || data.isPaidBypass) {
        toast.success("Appointment booked successfully!");
        window.location.href = `/checkout-success?booking_id=${data.booking._id}`;
      } else if (data.session && data.session.url) {
        window.location.href = data.session.url;
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="shadow-panelShadow p-3 lg:p-5 rounded-md">
      <div className="flex items-center justify-between">
        <p className="text_para mt-0 font-semibold">Ticket Price</p>
        <span className="text-[16px] leading-7 lg:text[22px] lg:leading-8 text-headingColor font-bold">
          {ticketPrice} LKR
        </span>
      </div>
      <div className="mt-[30px]">
        <p className="text_para mt-0 font-semibold text-headingColor">
          Available Time Slots
        </p>
        {scheduleStatus !== "Approved" ? (
          <div className="bg-yellow-50 border border-solid border-yellow-200 rounded p-3 text-center mt-3">
            <p className="text-yellow-700 font-semibold text-xs">
              Doctor's schedule is currently pending approval and cannot be booked.
            </p>
          </div>
        ) : (
          <ul className="mt-3">
            {timeSlots?.filter(item => item.enabled !== false).map(
              (
                item,
                index
              ) => (
                <li
                  key={index}
                  onClick={() => setSelectedTimeSlot(item)}
                  className={`flex items-center justify-between mb-2 p-2 rounded cursor-pointer transition-colors duration-200 ${selectedTimeSlot === item ? "bg-primaryColor text-white shadow-md transform scale-105" : "bg-gray-50 hover:bg-gray-100"}`}
                >
                  <p className={`text-[15px] leading-6 font-semibold ${selectedTimeSlot === item ? "text-white" : "text-textColor"}`}>
                    {item.day.charAt(0).toUpperCase() + item.day.slice(1)}
                  </p>
                  <p className={`text-[15px] leading-6 font-semibold ${selectedTimeSlot === item ? "text-white" : "text-textColor"}`}>
                    {convertTime(item.startingTime)} -{" "}
                    {convertTime(item.endingTime)}
                  </p>
                </li>
              )
            )}
          </ul>
        )}
      </div>
      {role === "doctor" ? (
        <div className="bg-red-50 border border-solid border-red-200 rounded p-3.5 mt-4 text-center">
          <p className="text-red-600 font-semibold text-[14px]">
            Booking appointments is disabled for doctors.
          </p>
        </div>
      ) : scheduleStatus !== "Approved" ? (
        <div className="bg-gray-50 border border-solid border-gray-200 rounded p-3.5 mt-4 text-center">
          <p className="text-gray-500 font-semibold text-xs">
            Booking is temporarily unavailable.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          <button
            className="w-full py-3 px-4 bg-primaryColor text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 font-sans"
            onClick={() => bookingHandler(false)}
          >
            Pay & Book Securely
          </button>
          <button
            className="w-full py-3 px-4 border border-solid border-primaryColor text-primaryColor font-semibold rounded-md hover:bg-primaryColor hover:text-white transition-all duration-200 font-sans cursor-pointer"
            onClick={() => bookingHandler(true)}
          >
            Book without Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default SidePanel;
