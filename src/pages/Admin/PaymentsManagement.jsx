import React, { useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import HashLoader from 'react-spinners/HashLoader';

const PaymentsManagement = () => {
    const { data: bookings, loading: bookingsLoading, error: bookingsError } = useFetchData(`${BASE_URL}/admin/bookings`);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBookings = bookings?.filter(booking => {
        if (!booking.user || !booking.user.name || booking.user.name === 'Unknown') return false;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            booking.user.name.toLowerCase().includes(searchLower) || 
            (booking.paymentId && booking.paymentId.toLowerCase().includes(searchLower)) ||
            (booking.appointmentId && booking.appointmentId.toLowerCase().includes(searchLower))
        );
    });

    return (
        <section>
             <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <h2 className="text-3xl font-bold text-headingColor dark:text-white">Payments Management</h2>
                <div className="flex gap-4 w-full md:w-auto">
                    <input 
                        type="search" 
                        placeholder="Search by Patient Name, Payment ID, or Appt ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="py-2 px-4 bg-[#0066ff2c] text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white w-full md:w-[350px]"
                    />
                </div>
            </div>

            {bookingsLoading && (
                <div className="flex justify-center items-center h-40">
                    <HashLoader size={40} color="#0067FF" />
                </div>
            )}
            {bookingsError && <p className="text-red-500 font-semibold text-center">{bookingsError}</p>}

            {!bookingsLoading && !bookingsError && filteredBookings && (
                <div className="bg-white dark:bg-slate-800 shadow-panelShadow rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#f4f7ff] dark:bg-slate-700 text-textColor dark:text-gray-300 border-b border-gray-200 dark:border-slate-600">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Payment ID</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Appointment ID</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Patient Name</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Amount</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Method</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Status</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((booking) => (
                                    <tr key={booking._id} className="border-b dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors text-sm">
                                        {/* Payment ID */}
                                        <td className="px-6 py-4 font-mono font-bold text-xs text-primaryColor">
                                            {booking.paymentId || 'PAY-Pending'}
                                        </td>
                                        {/* Appointment ID */}
                                        <td className="px-6 py-4 font-mono text-xs text-textColor dark:text-gray-350">
                                            {booking.appointmentId || 'APT-Pending'}
                                        </td>
                                        {/* Patient Name with avatar & email */}
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <img src={booking.user?.photo || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                            <div>
                                                <span className="font-semibold text-headingColor dark:text-white block">{booking.user?.name || 'Unknown'}</span>
                                                <span className="text-xs text-textColor dark:text-gray-400 block">{booking.user?.email || ''}</span>
                                            </div>
                                        </td>
                                        {/* Amount */}
                                        <td className="px-6 py-4 text-headingColor dark:text-white font-bold font-mono">
                                            {booking.ticketPrice || 0} LKR
                                        </td>
                                        {/* Method */}
                                        <td className="px-6 py-4">
                                            {booking.session ? (
                                                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-solid border-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/40 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                    Stripe Card
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-solid border-slate-200 dark:bg-slate-700/50 dark:text-slate-350 dark:border-slate-600/50 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                    Cash Bypass
                                                </span>
                                            )}
                                        </td>
                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                                                booking.isPaid 
                                                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30' 
                                                    : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30'
                                            }`}>
                                                {booking.isPaid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        {/* Creation Date */}
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300">
                                            {new Date(booking.createdAt).toLocaleDateString()}
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
