import React, { useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import HashLoader from 'react-spinners/HashLoader';

const PaymentsManagement = () => {
    const { data: bookings, loading: bookingsLoading, error: bookingsError } = useFetchData(`${BASE_URL}/admin/bookings`);
    const { data: doctors, loading: doctorsLoading, error: doctorsError } = useFetchData(`${BASE_URL}/doctors`);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBookings = bookings?.filter(booking => {
        if (!booking.user || !booking.user.name || booking.user.name === 'Unknown') return false;
        
        return booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               booking.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getDoctorSpeciality = (booking) => {
        if (booking.doctor?.specialization) return booking.doctor.specialization;
        if (doctors && booking.doctor) {
            const foundDoctor = doctors.find(d => d._id === booking.doctor._id || d.name === booking.doctor.name);
            if (foundDoctor?.specialization) return foundDoctor.specialization;
        }
        return 'N/A';
    };

    return (
        <section>
             <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <h2 className="text-3xl font-bold text-headingColor dark:text-white">Payments Management</h2>
                <div className="flex gap-4 w-full md:w-auto">
                    <input 
                        type="search" 
                        placeholder="Search by Patient or Doctor" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="py-2 px-4 bg-[#0066ff2c] text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white w-full md:w-[300px]"
                    />
                </div>
            </div>

            {(bookingsLoading || doctorsLoading) && (
                <div className="flex justify-center items-center h-40">
                    <HashLoader size={40} color="#0067FF" />
                </div>
            )}
            {(bookingsError || doctorsError) && <p className="text-red-500 font-semibold text-center">{bookingsError || doctorsError}</p>}

            {!(bookingsLoading || doctorsLoading) && !(bookingsError || doctorsError) && filteredBookings && (
                <div className="bg-white dark:bg-slate-800 shadow-panelShadow rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#f4f7ff] dark:bg-slate-700 text-textColor dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Patient Name</th>
                                    <th className="px-6 py-4 font-semibold">Doctor Name</th>
                                    <th className="px-6 py-4 font-semibold">Speciality</th>
                                    <th className="px-6 py-4 font-semibold">Appointment Date</th>
                                    <th className="px-6 py-4 font-semibold">Appointment Time</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Payment Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((booking) => (
                                    <tr key={booking._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <img src={booking.user?.photo || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            <span className="font-semibold text-headingColor dark:text-white">{booking.user?.name || 'Unknown'}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-textColor dark:text-gray-300">{booking.doctor?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300">{getDoctorSpeciality(booking)}</td>
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300 capitalize">
                                            {booking.appointmentTime?.day ? booking.appointmentTime.day : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300">
                                            {booking.appointmentTime?.startingTime ? `${booking.appointmentTime.startingTime} - ${booking.appointmentTime.endingTime}` : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300 font-bold">
                                            ${booking.ticketPrice || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {booking.isPaid ? 'Finished' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredBookings.length === 0 && (
                            <div className="p-6 text-center text-textColor dark:text-gray-400">
                                No payments found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default PaymentsManagement;
