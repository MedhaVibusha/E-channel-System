// eslint-disable-next-line no-unused-vars

import DoctorCard from "./../../components/Doctors/DoctorCard";
import { doctors } from "./../../assets/data/doctors";
import Testimonial from "./../../components/Testimonial/Testimonial";
import { BASE_URL } from "./../../config";
import useFetchData from "./../../hooks/useFetchData";
import Loading from "../../components/Loader/Loading";
import Error from "../../components/Error/Error";
import { useEffect, useState } from "react";
import { AiOutlineClockCircle } from "react-icons/ai";

const Doctors = () => {
  const [query, setQuery] = useState("");
  const [debounceQuery, setDebounceQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleSearch = () => {
    setQuery(query.trim());
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounceQuery(query);
    }, 700);

    return () => clearTimeout(timeout);
  }, [query]);

  // Set up timer for automatically updating today's available doctors list
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const {
    data: allDoctors,
    loading,
    error,
  } = useFetchData(`${BASE_URL}/doctors?query=${debounceQuery}`);

  const normalizeTime = (timeStr) => {
    if (!timeStr) return "00:00";
    let normalized = timeStr.replace(".", ":");
    if (normalized.indexOf(":") === 1) {
      normalized = "0" + normalized;
    }
    return normalized;
  };

  const getTodayAvailableDoctors = (list) => {
    if (!list) return [];

    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDayName = daysOfWeek[currentTime.getDay()];

    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    return list.filter((doctor) => {
      if (!doctor.timeSlots || doctor.timeSlots.length === 0) return false;

      return doctor.timeSlots.some((slot) => {
        const isToday = slot.day?.toLowerCase().trim() === currentDayName;
        const isEnabled = slot.enabled !== false;
        const end = normalizeTime(slot.endingTime);
        return isToday && isEnabled && currentTimeStr < end;
      });
    });
  };

  const todayAvailable = getTodayAvailableDoctors(allDoctors);
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDayName = daysOfWeek[currentTime.getDay()];
  const formattedDay = currentDayName.charAt(0).toUpperCase() + currentDayName.slice(1);

  return (
    <>
      <section className="bg-[#fff9ea]">
        <div className="container text-center">
          <h2 className="heading">Find a doctor</h2>
          <div className="max-w-[570px] mt-[30px] mx-auto bg-[#0066ff2c] rounded-md flex items-center justify-between">
            <input
              type="search"
              className="py-4 pl-4 pr-2 bg-transparent w-full focus:outline-none cursor-pointer placeholder:text-textColor"
              placeholder="Search Doctor by Name or Speciality"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              className="btn mt-0 rounded-[0px] rounded-r-md"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          {loading && <Loading />}
          {error && <Error />}

          {!loading && !error && (
            <>
              {/* Today's Available Doctors Section */}
              <div className="mb-12 bg-white p-6 rounded-2xl border border-gray-100 shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-[22px] leading-8 lg:text-[26px] lg:leading-9 text-headingColor font-[800] flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      Today's Available Doctors
                    </h2>
                    <p className="text_para mt-1 text-[14px]">
                      Scheduled and ready for appointments today ({formattedDay}). Automatically updates as time progresses.
                    </p>
                  </div>
                </div>

                {todayAvailable.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {todayAvailable.map((doctor) => (
                      <div key={doctor._id} className="border border-solid border-gray-100 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <DoctorCard doctor={doctor} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50/50 rounded-xl py-12 px-4 text-center border border-dashed border-gray-200">
                    <p className="text-textColor italic text-sm md:text-base font-medium">
                      No doctors scheduled or available for the remaining part of today ({formattedDay}).
                    </p>
                    <p className="text-xs text-textColor/70 mt-1">
                      Please check the full roster below or schedule a booking for another day.
                    </p>
                  </div>
                )}
              </div>

              {/* Main Doctors List Section */}
              <div className="text-center mb-8 mt-12">
                <h3 className="text-[20px] leading-[30px] font-bold text-headingColor border-t border-gray-100 pt-10">
                  All Active Roster Doctors ({allDoctors?.length || 0})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 ">
                {allDoctors && allDoctors.map((doctor) => (
                  <DoctorCard key={doctor._id} doctor={doctor} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section>
        <div className="container">
          <div className="xl:w-[470px] mx-auto">
            <h2 className="heading text-center">What our patient say</h2>
            <p className="text__para text-center">
              World-class care for everyone. Our health system offers unmatched,
              expert health care
            </p>
          </div>

          <Testimonial />
        </div>
      </section>
    </>
  );
};

export default Doctors;

// eslint-disable-next-line no-unused-vars

// import DoctorCard from "./../../components/Doctors/DoctorCard";
// import { doctors } from "./../../assets/data/doctors";
// import Testimonial from "./../../components/Testimonial/Testimonial";
// import { BASE_URL } from "./../../config";
// import useFetchData from "./../../hooks/useFetchData";
// import Loading from "../../components/Loader/Loading";
// import Error from "../../components/Error/Error";
// import { useEffect, useState } from "react";

// const Doctors = () => {

//   return (
//     <>
//       <section className="bg-[#fff9ea]">
//         <div className="container text-center">
//           <h2 className="heading">Find a doctor</h2>
//           <div className="max-w-[570px] mt-[30px] mx-auto bg-[#0066ff2c] rounded-md flex items-center justify-between">
//             <input
//               type="search"
//               className="py-4 pl-4 pr-2 bg-transparent w-full focus:outline-none cursor-pointer placeholder:text-textColor"
//               placeholder="Search Doctor"
//             />
//             <button className="btn mt-0 rounded-[0px] rounded-r-md">
//               Search
//             </button>
//           </div>
//         </div>
//       </section>

//       <section>
//         <div className="container">

//         <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 '>
//           {doctors.map(doctor=>(
//             <DoctorCard key={doctor.id} doctor={doctor}/>
//           ))}

//         </div>
//         </div>
//       </section>

//       <section>
//         <div className="container">
//           <div className="xl:w-[470px] mx-auto">
//             <h2 className="heading text-center">What our patient say</h2>
//             <p className="text__para text-center">
//               World-class care for everyone. Our health system offers unmatched,
//               expert health care
//             </p>
//           </div>

//           <Testimonial />
//         </div>
//       </section>
//     </>
//   );
// };

// export default Doctors;
