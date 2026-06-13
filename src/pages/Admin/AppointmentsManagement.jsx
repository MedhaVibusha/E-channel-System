import React, { useState, useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import HashLoader from 'react-spinners/HashLoader';

const AppointmentsManagement = () => {
    const { data: bookings, loading: bookingsLoading, error: bookingsError } = useFetchData(`${BASE_URL}/admin/bookings`);
    const { data: doctors, loading: doctorsLoading, error: doctorsError } = useFetchData(`${BASE_URL}/doctors`);
    const [searchQuery, setSearchQuery] = useState(''); // combine date and time search
    const [searchDoctor, setSearchDoctor] = useState('');
    const [searchPatient, setSearchPatient] = useState('');

    const filteredBookings = useMemo(() => {
        return bookings?.filter(booking => {
            if (!booking.user || !booking.user.name || booking.user.name === 'Unknown') return false;

            const matchesDoctor = booking.doctor?.name?.toLowerCase().includes(searchDoctor.toLowerCase());
            const matchesPatient = booking.user.name.toLowerCase().includes(searchPatient.toLowerCase());
            
            // Search date and time
            let dateTimeString = '';
            if (booking.appointmentTime) {
                dateTimeString = `${booking.appointmentTime.day} ${booking.appointmentTime.startingTime} ${booking.appointmentTime.endingTime}`.toLowerCase();
            }
            const matchesDateTime = searchQuery ? dateTimeString.includes(searchQuery.toLowerCase()) : true;
            
            return matchesDoctor && matchesDateTime && matchesPatient;
        }) || [];
    }, [bookings, searchDoctor, searchQuery, searchPatient]);

    const getDoctorSpeciality = (booking) => {
        if (booking.doctor?.specialization) return booking.doctor.specialization;
        if (doctors && booking.doctor) {
            const foundDoctor = doctors.find(d => d._id === booking.doctor._id || d.name === booking.doctor.name);
            if (foundDoctor?.specialization) return foundDoctor.specialization;
        }
        return 'N/A';
    };

    const totalAppointments = filteredBookings.length;

    // Compute Summary for the filtered day/doctor
    const doctorSummary = useMemo(() => {
        const summary = {};
        
        // Initialize with all doctors
        if (doctors) {
            doctors.forEach(doc => {
                summary[doc.name] = { 
                    appointments: 0, 
                    patients: new Set(),
                    speciality: doc.specialization || 'N/A'
                };
            });
        }

        filteredBookings.forEach(booking => {
            const docName = booking.doctor?.name || 'Unknown Doctor';
            if (!summary[docName]) {
                summary[docName] = { 
                    appointments: 0, 
                    patients: new Set(),
                    speciality: booking.doctor?.specialization || 'N/A'
                };
            }
            summary[docName].appointments++;
            if (booking.user?._id) {
                summary[docName].patients.add(booking.user._id);
            } else if (booking.user?.name) {
                summary[docName].patients.add(booking.user.name);
            }
        });
        return Object.entries(summary).map(([name, data]) => ({
            name,
            speciality: data.speciality,
            appointments: data.appointments,
            uniquePatients: data.patients.size
        }));
    }, [filteredBookings, doctors]);

    return (
        <section>
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <h2 className="text-3xl font-bold text-headingColor dark:text-white">Appointments Management</h2>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-panelShadow p-6 rounded-xl mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 w-full flex-wrap">
                    <input 
                        type="search" 
                        placeholder="Search by Patient Name..." 
                        value={searchPatient}
                        onChange={(e) => setSearchPatient(e.target.value)}
                        className="py-2 px-4 bg-[#0066ff2c] text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white flex-1 min-w-[150px]"
                    />
                    <input 
                        type="search" 
                        placeholder="Search by Doctor Name..." 
                        value={searchDoctor}
                        onChange={(e) => setSearchDoctor(e.target.value)}
                        className="py-2 px-4 bg-[#0066ff2c] text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white flex-1 min-w-[150px]"
                    />
                    <input 
                        type="text" 
                        placeholder="Search Date or Time..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="py-2 px-4 bg-[#0066ff2c] text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white flex-1 min-w-[200px]"
                    />
                </div>
                <div className="bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-6 py-2 rounded-lg font-bold text-lg whitespace-nowrap border border-blue-200 dark:border-blue-700">
                    Total: {totalAppointments}
                </div>
            </div>

            {(bookingsLoading || doctorsLoading) && (
                <div className="flex justify-center items-center h-40">
                    <HashLoader size={40} color="#0067FF" />
                </div>
            )}
            {(bookingsError || doctorsError) && <p className="text-red-500 font-semibold text-center">{bookingsError || doctorsError}</p>}

            {!(bookingsLoading || doctorsLoading) && !(bookingsError || doctorsError) && filteredBookings && (
                <>
                    {/* Summary Section */}
                    {doctorSummary.length > 0 && (
                        <div className="mb-8 bg-white dark:bg-slate-800 shadow-panelShadow p-6 rounded-xl">
                            <h3 className="text-xl font-bold text-headingColor dark:text-white mb-4">Doctor Summary</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left bg-white dark:bg-slate-800 border-collapse border border-gray-200 dark:border-slate-700 rounded-lg">
                                    <thead className="bg-[#f4f7ff] dark:bg-slate-700 text-textColor dark:text-gray-300">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold border-b border-gray-200 dark:border-slate-600">Doctor Name</th>
                                            <th className="px-6 py-3 font-semibold border-b border-gray-200 dark:border-slate-600">Speciality</th>
                                            <th className="px-6 py-3 font-semibold border-b border-gray-200 dark:border-slate-600">Appointments</th>
                                            <th className="px-6 py-3 font-semibold border-b border-gray-200 dark:border-slate-600">Patients</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {doctorSummary.map((doc, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                                <td className="px-6 py-3 border-b border-gray-200 dark:border-slate-700 font-bold text-primaryColor">{doc.name}</td>
                                                <td className="px-6 py-3 border-b border-gray-200 dark:border-slate-700 text-textColor dark:text-gray-300 font-medium">{doc.speciality}</td>
                                                <td className="px-6 py-3 border-b border-gray-200 dark:border-slate-700 font-bold text-headingColor dark:text-white">{doc.appointments}</td>
                                                <td className="px-6 py-3 border-b border-gray-200 dark:border-slate-700 font-bold text-headingColor dark:text-white">{doc.uniquePatients}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 shadow-panelShadow rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#f4f7ff] dark:bg-slate-700 text-textColor dark:text-gray-300">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold whitespace-nowrap">Patient Name</th>
                                        <th className="px-6 py-4 font-semibold whitespace-nowrap">Doctor Name</th>
                                        <th className="px-6 py-4 font-semibold whitespace-nowrap">Speciality</th>
                                        <th className="px-6 py-4 font-semibold whitespace-nowrap">Appointment Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3 whitespace-nowrap">
                                                <img src={booking.user?.photo || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                <span className="font-semibold text-headingColor dark:text-white">{booking.user?.name || 'Unknown'}</span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-textColor dark:text-gray-300 whitespace-nowrap">{booking.doctor?.name || 'Unknown'}</td>
                                            <td className="px-6 py-4 text-textColor dark:text-gray-300 whitespace-nowrap">{getDoctorSpeciality(booking)}</td>
                                            <td className="px-6 py-4 text-textColor dark:text-gray-300 whitespace-nowrap">
                                                {booking.appointmentTime ? `${booking.appointmentTime.day} | ${booking.appointmentTime.startingTime} - ${booking.appointmentTime.endingTime}` : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredBookings.length === 0 && (
                                <div className="p-6 text-center text-textColor dark:text-gray-400">
                                    No appointments found for this criteria.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};

export default AppointmentsManagement;
