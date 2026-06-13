import React, { useState, useEffect } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import HashLoader from 'react-spinners/HashLoader';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DoctorsManagement = () => {
    const { data: doctorsData, loading, error } = useFetchData(`${BASE_URL}/admin/doctors`);
    const [searchTerm, setSearchTerm] = useState('');
    const [doctorList, setDoctorList] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (doctorsData) {
            setDoctorList(doctorsData);
        }
    }, [doctorsData]);

    const filteredDoctors = doctorList?.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/admin/doctors/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isApproved: newStatus })
            });

            const result = await res.json();
            if(!res.ok) throw new Error(result.message);

            toast.success("Doctor status updated successfully");
            setDoctorList(prev => prev.map(doc => doc._id === id ? { ...doc, isApproved: newStatus } : doc));
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <section>
            <div className="flex flex-col mb-8 gap-6">
                <h2 className="text-3xl font-bold text-headingColor dark:text-white">Doctors Management</h2>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                    <input 
                        type="search" 
                        placeholder="Search doctors..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="py-2 px-4 bg-[#0066ff2c] text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white w-full md:w-[400px]"
                    />
                    <div className="flex gap-4 w-full md:w-auto md:justify-end">
                        <button 
                            onClick={() => navigate('/register')}
                            className="bg-primaryColor text-white px-6 py-2 rounded-md font-semibold hover:bg-[#0052cc] transition-colors whitespace-nowrap"
                        >
                            Add Doctor
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center h-40">
                    <HashLoader size={40} color="#0067FF" />
                </div>
            )}
            {error && <p className="text-red-500 font-semibold text-center">{error}</p>}

            {!loading && !error && filteredDoctors && (
                <div className="bg-white dark:bg-slate-800 shadow-panelShadow rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#f4f7ff] dark:bg-slate-700 text-textColor dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Doctor Name</th>
                                    <th className="px-6 py-4 font-semibold">Speciality</th>
                                    <th className="px-6 py-4 font-semibold">Ticket Price</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDoctors.map((doctor) => (
                                    <tr key={doctor._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <img src={doctor.photo || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            <span className="font-semibold text-headingColor dark:text-white">{doctor.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300">{doctor.specialization || 'N/A'}</td>
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300">${doctor.ticketPrice || 0}</td>
                                        <td className="px-6 py-4">
                                            <select 
                                                value={doctor.isApproved} 
                                                onChange={(e) => handleStatusChange(doctor._id, e.target.value)}
                                                className={`px-3 py-1 rounded border-none font-semibold text-sm cursor-pointer outline-none focus:ring-2 focus:ring-primaryColor ${
                                                    doctor.isApproved === 'approved' ? 'bg-green-100 text-green-700' : 
                                                    doctor.isApproved === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}
                                            >
                                                <option value="pending">pending</option>
                                                <option value="approved">approved</option>
                                                <option value="cancelled">cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredDoctors.length === 0 && (
                            <div className="p-6 text-center text-textColor dark:text-gray-400">
                                No doctors found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default DoctorsManagement;
