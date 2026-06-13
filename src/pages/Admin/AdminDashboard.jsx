import React from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import HashLoader from 'react-spinners/HashLoader';
import { FaUserMd, FaUsers, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';

const AdminDashboard = () => {
    const { data: stats, loading, error } = useFetchData(`${BASE_URL}/admin/stats`);

    return (
        <section>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-headingColor dark:text-white">Dashboard Overview</h2>
            </div>

            {loading && (
                <div className="flex justify-center items-center h-full">
                    <HashLoader size={50} color="#0067FF" />
                </div>
            )}
            {error && <p className="text-red-500 font-semibold">{error}</p>}

            {!loading && !error && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Doctors Card */}
                    <div className="bg-white dark:bg-slate-800 p-10 min-h-[250px] rounded-xl shadow-panelShadow flex flex-col items-center justify-center gap-4 transition-transform hover:-translate-y-1 text-center border border-gray-100 dark:border-slate-700">
                        <div className="bg-blue-100 dark:bg-blue-900 text-primaryColor dark:text-blue-200 p-6 rounded-full text-5xl shadow-sm">
                            <FaUserMd />
                        </div>
                        <div>
                            <p className="text-lg text-textColor dark:text-gray-300 font-semibold mb-2">Total Doctors</p>
                            <h3 className="text-4xl text-headingColor dark:text-white font-bold">{stats.totalDoctors || 0}</h3>
                        </div>
                    </div>

                    {/* Patients Card */}
                    <div className="bg-white dark:bg-slate-800 p-10 min-h-[250px] rounded-xl shadow-panelShadow flex flex-col items-center justify-center gap-4 transition-transform hover:-translate-y-1 text-center border border-gray-100 dark:border-slate-700">
                        <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 p-6 rounded-full text-5xl shadow-sm">
                            <FaUsers />
                        </div>
                        <div>
                            <p className="text-lg text-textColor dark:text-gray-300 font-semibold mb-2">Total Patients</p>
                            <h3 className="text-4xl text-headingColor dark:text-white font-bold">{stats.totalPatients || 0}</h3>
                        </div>
                    </div>

                    {/* Appointments Card */}
                    <div className="bg-white dark:bg-slate-800 p-10 min-h-[250px] rounded-xl shadow-panelShadow flex flex-col items-center justify-center gap-4 transition-transform hover:-translate-y-1 text-center border border-gray-100 dark:border-slate-700">
                        <div className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 p-6 rounded-full text-5xl shadow-sm">
                            <FaCalendarAlt />
                        </div>
                        <div>
                            <p className="text-lg text-textColor dark:text-gray-300 font-semibold mb-2">Total Appointments</p>
                            <h3 className="text-4xl text-headingColor dark:text-white font-bold">{stats.totalAppointments || 0}</h3>
                        </div>
                    </div>

                    {/* Revenue Card */}
                    <div className="bg-white dark:bg-slate-800 p-10 min-h-[250px] rounded-xl shadow-panelShadow flex flex-col items-center justify-center gap-4 transition-transform hover:-translate-y-1 text-center border border-gray-100 dark:border-slate-700">
                        <div className="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-200 p-6 rounded-full text-5xl shadow-sm">
                            <FaMoneyBillWave />
                        </div>
                        <div>
                            <p className="text-lg text-textColor dark:text-gray-300 font-semibold mb-2">Total Revenue</p>
                            <h3 className="text-4xl text-headingColor dark:text-white font-bold">${stats.totalRevenue || 0}</h3>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AdminDashboard;
