import React from "react";
import starIcon from "../../assets/images/Star.png";
import { Link } from "react-router-dom";
import { BsArrowRight } from "react-icons/bs";
import convertTime from "../../../utils/convertTime";

const DoctorCard = ({ doctor }) => {
  const {
    name,
    avgRating,
    totalRating,
    photo,
    specialization,
    totalPatients,
    hospital,
    timeSlots,
  } = doctor;

  const getAvailability = () => {
    if (!timeSlots || timeSlots.length === 0) return null;

    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const now = new Date();
    const currentDayName = daysOfWeek[now.getDay()];

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    const normalizeTime = (timeStr) => {
      if (!timeStr) return "00:00";
      let normalized = timeStr.replace(".", ":");
      if (normalized.indexOf(":") === 1) {
        normalized = "0" + normalized;
      }
      return normalized;
    };

    const todaySlot = timeSlots.find((slot) => {
      const isToday = slot.day?.toLowerCase().trim() === currentDayName;
      const isEnabled = slot.enabled !== false;
      const end = normalizeTime(slot.endingTime);
      return isToday && isEnabled && currentTimeStr < end;
    });

    if (!todaySlot) return null;

    const start = normalizeTime(todaySlot.startingTime);
    const end = normalizeTime(todaySlot.endingTime);
    const isLive = currentTimeStr >= start && currentTimeStr <= end;

    return {
      isLive,
      slot: todaySlot,
    };
  };

  const availability = getAvailability();

  return (
    <div className="p-3 lg:p-5">
      <div>
        <img src={photo} className="w-full" alt="" />
      </div>

      <h2 className="text-[18px] leading-[30px] lg:text-[26px] lg:leading-9 text-headingColor font-[700] mt-3 lg:mt-5">
        {name}
      </h2>

      <div className="mt-2 lg:mt-4 flex items-center justify-between gap-2">
        <span className="bg-[#CCF0F3] text-irisBlueColor py-1 px-2 lg:py-1.5 lg:px-4 text-[12px] leading-4 lg:text-[14px] font-semibold rounded shrink-0">
          {specialization}
        </span>

        {availability && (
          <div className="flex items-center shrink-0">
            {availability.isLive ? (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 py-1 px-2.5 text-[11px] font-bold rounded-full animate-pulse shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block"></span>
                Available Now
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 py-1 px-2.5 text-[11px] font-bold rounded-full shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block"></span>
                Today: {convertTime(availability.slot.startingTime)}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-[6px] shrink-0">
          <span className="flex items-center gap-[6px] text-[14px] leading-6 lg:text-[16px] lg:leading-7 font-semibold text-headingColor">
            <img src={starIcon} alt="" /> {avgRating}
          </span>
          <span className="text-[14px] leading-6 lg:text-[16px] lg:leading-7 font-[400] text-textColor">
            ({totalRating})
          </span>
        </div>
      </div>

      <div className="mt-[18px] lg:mt-5 flex items-center justify-between">
        <div>
          <h3 className="text-[16px] leading-7 lg:text-[18px] lg:leading-[30px] font-semibold text-headingColor">
            +{totalPatients} patients
          </h3>
          <p className="text-[14px] leading-6 font-[400] text-textColor">
            At {hospital}
          </p>
        </div>

        <Link
          to={`/doctors/${doctor._id}`}
          className="w-[44px] h-[44px] rounded-full border border-solid border-[#181A1E] flex items-center justify-center group hover:bg-primaryColor hover:border-none"
        >
          <BsArrowRight className="group-hover:text-white w-6 h-5" />
        </Link>
      </div>
    </div>
  );
};

export default DoctorCard;
