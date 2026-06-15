import React, { useState, useMemo, useEffect } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import HashLoader from 'react-spinners/HashLoader';
import { toast } from 'react-toastify';
import { FaEye, FaEdit, FaCalendarAlt, FaPlus, FaSearch, FaClock, FaCheck, FaTimes } from 'react-icons/fa';

const AppointmentsManagement = () => {
    const { data: bookings, loading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useFetchData(`${BASE_URL}/admin/bookings`);
    const { data: doctors, loading: doctorsLoading, error: doctorsError } = useFetchData(`${BASE_URL}/doctors`);
    const { data: patients, loading: patientsLoading, error: patientsError } = useFetchData(`${BASE_URL}/admin/patients`);

    const loading = bookingsLoading || doctorsLoading || patientsLoading;
    const error = bookingsError || doctorsError || patientsError;

    // Filters
    const [searchPatient, setSearchPatient] = useState('');
    const [searchPatientId, setSearchPatientId] = useState('');
    const [searchDoctor, setSearchDoctor] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [searchDate, setSearchDate] = useState('');

    // Modals
    const [showViewModal, setShowViewModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [addForm, setAddForm] = useState({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        timeSlotIndex: '',
        status: 'Confirmed',
        isPaid: true,
        visitCompleted: 'No',
        remark: '',
        patientMessage: ''
    });

    const [editForm, setEditForm] = useState({
        status: '',
        isPaid: true,
        visitCompleted: 'No',
        remark: '',
        patientMessage: ''
    });

    const [rescheduleForm, setRescheduleForm] = useState({
        appointmentDate: '',
        timeSlotIndex: ''
    });

    // Populate selected doctor slots for forms
    const doctorSlots = useMemo(() => {
        if (!addForm.doctorId || !doctors) return [];
        const found = doctors.find(d => d._id === addForm.doctorId);
        return found?.timeSlots || [];
    }, [addForm.doctorId, doctors]);

    const rescheduleDoctorSlots = useMemo(() => {
        if (!selectedBooking || !doctors) return [];
        const docId = selectedBooking.doctor?._id || selectedBooking.doctor;
        const found = doctors.find(d => d._id === docId);
        return found?.timeSlots || [];
    }, [selectedBooking, doctors]);

    // Filters logic
    const filteredBookings = useMemo(() => {
        return bookings?.filter(booking => {
            if (!booking.user || !booking.user.name || booking.user.name === 'Unknown') return false;

            const matchesPatient = booking.user.name.toLowerCase().includes(searchPatient.toLowerCase());
            const matchesPatientId = booking.user.patientId?.toLowerCase().includes(searchPatientId.toLowerCase());
            const matchesDoctor = booking.doctor?.name?.toLowerCase().includes(searchDoctor.toLowerCase());
            const matchesStatus = searchStatus ? booking.status === searchStatus : true;
            
            let matchesDate = true;
            if (searchDate) {
                const bookingDate = booking.appointmentDate ? new Date(booking.appointmentDate).toISOString().split('T')[0] : '';
                matchesDate = bookingDate === searchDate;
            }

            return matchesPatient && matchesPatientId && matchesDoctor && matchesStatus && matchesDate;
        }) || [];
    }, [bookings, searchPatient, searchPatientId, searchDoctor, searchStatus, searchDate]);

    // Helpers
    const getDoctorSpeciality = (booking) => {
        return booking.doctor?.specialization || 'N/A';
    };

    // Actions
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!addForm.patientId || !addForm.doctorId || !addForm.appointmentDate || addForm.timeSlotIndex === '') {
            toast.error("Please fill all required fields");
            return;
        }

        const selectedSlot = doctorSlots[addForm.timeSlotIndex];
        const payload = {
            patientId: addForm.patientId,
            doctorId: addForm.doctorId,
            appointmentDate: addForm.appointmentDate,
            appointmentTime: selectedSlot,
            status: addForm.status,
            isPaid: addForm.isPaid,
            visitCompleted: addForm.visitCompleted,
            remark: addForm.remark,
            patientMessage: addForm.patientMessage
        };

        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/admin/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok) {
                toast.success("Appointment added successfully");
                setShowAddModal(false);
                refetchBookings();
            } else {
                toast.error(result.message || "Failed to add appointment");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/admin/bookings/${selectedBooking._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            const result = await res.json();
            if (res.ok) {
                toast.success("Appointment updated successfully");
                setShowEditModal(false);
                refetchBookings();
            } else {
                toast.error(result.message || "Failed to update appointment");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRescheduleSubmit = async (e) => {
        e.preventDefault();
        if (!rescheduleForm.appointmentDate || rescheduleForm.timeSlotIndex === '') {
            toast.error("Please fill all fields");
            return;
        }

        const selectedSlot = rescheduleDoctorSlots[rescheduleForm.timeSlotIndex];
        const payload = {
            appointmentDate: rescheduleForm.appointmentDate,
            appointmentTime: selectedSlot
        };

        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/admin/bookings/${selectedBooking._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok) {
                toast.success("Appointment rescheduled successfully");
                setShowRescheduleModal(false);
                refetchBookings();
            } else {
                toast.error(result.message || "Failed to reschedule appointment");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickCancel = async (bookingId) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/admin/bookings/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'Cancelled' })
            });
            const result = await res.json();
            if (res.ok) {
                toast.success("Appointment cancelled");
                refetchBookings();
            } else {
                toast.error(result.message || "Failed to cancel appointment");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    const handleMarkVisitCompleted = async (bookingId, isCompleted) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/admin/bookings/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ visitCompleted: isCompleted ? "Yes" : "No", status: isCompleted ? "Completed" : "Confirmed" })
            });
            const result = await res.json();
            if (res.ok) {
                toast.success(isCompleted ? "Visit marked as completed" : "Visit status updated");
                refetchBookings();
            } else {
                toast.error(result.message || "Failed to update visit completed status");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    return (
        <section className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <h2 className="text-3xl font-bold text-headingColor dark:text-white">Appointments Management</h2>
                <button
                    onClick={() => {
                        setAddForm({
                            patientId: '',
                            doctorId: '',
                            appointmentDate: '',
                            timeSlotIndex: '',
                            status: 'Confirmed',
                            isPaid: true,
                            visitCompleted: 'No',
                            remark: '',
                            patientMessage: ''
                        });
                        setShowAddModal(true);
                    }}
                    className="bg-primaryColor text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#0052cc] transition-colors flex items-center gap-2 shadow-sm"
                >
                    <FaPlus /> Add Appointment
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 shadow-panelShadow p-6 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 border border-gray-100 dark:border-slate-700">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Patient Name</label>
                    <input 
                        type="search" 
                        placeholder="Search Patient Name..." 
                        value={searchPatient}
                        onChange={(e) => setSearchPatient(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white border dark:border-slate-600 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Patient ID</label>
                    <input 
                        type="search" 
                        placeholder="Search Patient ID..." 
                        value={searchPatientId}
                        onChange={(e) => setSearchPatientId(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white border dark:border-slate-600 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Doctor Name</label>
                    <input 
                        type="search" 
                        placeholder="Search Doctor Name..." 
                        value={searchDoctor}
                        onChange={(e) => setSearchDoctor(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white border dark:border-slate-600 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                    <select
                        value={searchStatus}
                        onChange={(e) => setSearchStatus(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white border dark:border-slate-600 text-sm h-[38px]"
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
                    <input 
                        type="date" 
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white border dark:border-slate-600 text-sm h-[38px]"
                    />
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center h-40">
                    <HashLoader size={40} color="#0067FF" />
                </div>
            )}
            {error && <p className="text-red-500 font-semibold text-center">{error}</p>}

            {!loading && !error && filteredBookings && (
                <div className="bg-white dark:bg-slate-800 shadow-panelShadow rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#f4f7ff] dark:bg-slate-700 text-textColor dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Patient ID</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Patient Name</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Doctor Name</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Speciality</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Date & Time Slot</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Visit Completed</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((booking) => (
                                    <tr key={booking._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-xs text-primaryColor whitespace-nowrap">
                                            {booking.user?.patientId || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-3 whitespace-nowrap">
                                            <img src={booking.user?.photo || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover border" />
                                            <span className="font-semibold text-headingColor dark:text-white">{booking.user?.name || 'Unknown'}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-textColor dark:text-gray-300 whitespace-nowrap">{booking.doctor?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300 whitespace-nowrap capitalize">{getDoctorSpeciality(booking)}</td>
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300 whitespace-nowrap">
                                            {booking.appointmentDate ? new Date(booking.appointmentDate).toLocaleDateString() : 'N/A'}{' '}
                                            {booking.appointmentTime ? `(${booking.appointmentTime.day} | ${booking.appointmentTime.startingTime} - ${booking.appointmentTime.endingTime})` : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                booking.status === 'Completed' || booking.status === 'Confirmed' || booking.status === 'Approved'
                                                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20'
                                                    : booking.status === 'Cancelled'
                                                    ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20'
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20'
                                            }`}>
                                                {booking.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold text-sm ${booking.visitCompleted === 'Yes' ? 'text-green-600' : 'text-textColor'}`}>
                                                    {booking.visitCompleted || 'No'}
                                                </span>
                                                <input 
                                                    type="checkbox"
                                                    checked={booking.visitCompleted === 'Yes'}
                                                    onChange={(e) => handleMarkVisitCompleted(booking._id, e.target.checked)}
                                                    className="w-4.5 h-4.5 accent-primaryColor cursor-pointer"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2 text-xs">
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setShowViewModal(true);
                                                    }}
                                                    className="bg-blue-50 hover:bg-blue-100 text-primaryColor dark:bg-slate-700 dark:text-blue-300 px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1"
                                                >
                                                    <FaEye /> View
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setEditForm({
                                                            status: booking.status,
                                                            isPaid: booking.isPaid,
                                                            visitCompleted: booking.visitCompleted || 'No',
                                                            remark: booking.remark || '',
                                                            patientMessage: booking.patientMessage || ''
                                                        });
                                                        setShowEditModal(true);
                                                    }}
                                                    className="bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-slate-700 dark:text-orange-300 px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setRescheduleForm({
                                                            appointmentDate: booking.appointmentDate ? new Date(booking.appointmentDate).toISOString().split('T')[0] : '',
                                                            timeSlotIndex: ''
                                                        });
                                                        setShowRescheduleModal(true);
                                                    }}
                                                    className="bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-slate-700 dark:text-purple-300 px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1"
                                                >
                                                    <FaCalendarAlt /> Reschedule
                                                </button>
                                                {booking.status !== 'Cancelled' && (
                                                    <button
                                                        onClick={() => handleQuickCancel(booking._id)}
                                                        className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-slate-700 dark:text-red-300 px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1"
                                                    >
                                                        <FaTimes /> Cancel
                                                    </button>
                                                )}
                                            </div>
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
            )}

            {/* ================= VIEW MODAL ================= */}
            {showViewModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl border dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b dark:border-slate-700 mb-6">
                            <h3 className="text-xl font-bold text-headingColor dark:text-white">Appointment Details</h3>
                            <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="space-y-4 text-sm text-textColor dark:text-gray-300">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase">Appointment ID / Number</h4>
                                <p className="font-mono font-bold text-primaryColor text-base">{selectedBooking.appointmentId || 'N/A'} (Slot Queue: #{selectedBooking.bookingNumber || 'N/A'})</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Patient</h4>
                                    <p className="font-semibold text-headingColor dark:text-white">{selectedBooking.user?.name} (ID: {selectedBooking.user?.patientId})</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Doctor</h4>
                                    <p className="font-semibold text-headingColor dark:text-white">{selectedBooking.doctor?.name} ({selectedBooking.doctor?.specialization})</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Date & Time</h4>
                                    <p className="font-semibold text-headingColor dark:text-white">{selectedBooking.appointmentDate ? new Date(selectedBooking.appointmentDate).toLocaleDateString() : 'N/A'}</p>
                                    <p className="text-xs">{selectedBooking.appointmentTime ? `${selectedBooking.appointmentTime.day} (${selectedBooking.appointmentTime.startingTime} - ${selectedBooking.appointmentTime.endingTime})` : ''}</p>
                                    <p className="text-xs text-primaryColor font-semibold">Consultation Time: {selectedBooking.consultationTime || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Fee & Payment</h4>
                                    <p className="font-semibold text-headingColor dark:text-white">{selectedBooking.ticketPrice || 0} LKR</p>
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold inline-block ${selectedBooking.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {selectedBooking.isPaid ? 'Paid' : 'Unpaid'}
                                    </span>
                                    <p className="text-[10px] text-gray-400 font-mono mt-1">Ref ID: {selectedBooking.paymentId || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Appointment Status</h4>
                                    <span className="font-semibold text-headingColor dark:text-white capitalize text-sm">{selectedBooking.status}</span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Visit Completed</h4>
                                    <span className={`font-semibold text-sm ${selectedBooking.visitCompleted === 'Yes' ? 'text-green-600' : 'text-textColor'}`}>{selectedBooking.visitCompleted || 'No'}</span>
                                </div>
                            </div>
                            {selectedBooking.remark && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Admin Remark</h4>
                                    <p className="bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded text-xs">{selectedBooking.remark}</p>
                                </div>
                            )}
                            {selectedBooking.patientMessage && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Patient Message</h4>
                                    <p className="bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded text-xs">{selectedBooking.patientMessage}</p>
                                </div>
                            )}
                            {selectedBooking.diagnosis && (
                                <div className="border-t pt-3 dark:border-slate-700">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">EMR Diagnosis & Prescription</h4>
                                    <p className="text-xs"><strong className="text-headingColor dark:text-white">Diagnosis:</strong> {selectedBooking.diagnosis}</p>
                                    <p className="text-xs mt-1"><strong className="text-headingColor dark:text-white">Prescription:</strong> {selectedBooking.prescription}</p>
                                    <p className="text-xs mt-1"><strong className="text-headingColor dark:text-white">Consultation Notes:</strong> {selectedBooking.consultationNotes}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowViewModal(false)} className="bg-primaryColor hover:bg-[#0052cc] text-white px-5 py-2 rounded-lg font-semibold text-sm">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= ADD MODAL ================= */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleAddSubmit} className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl border dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b dark:border-slate-700 mb-6">
                            <h3 className="text-xl font-bold text-headingColor dark:text-white">Add New Appointment</h3>
                            <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Select Patient *</label>
                                <select
                                    required
                                    value={addForm.patientId}
                                    onChange={(e) => setAddForm({ ...addForm, patientId: e.target.value })}
                                    className="w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                >
                                    <option value="">Select Patient</option>
                                    {patients?.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.patientId || 'No ID'})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Select Doctor *</label>
                                <select
                                    required
                                    value={addForm.doctorId}
                                    onChange={(e) => setAddForm({ ...addForm, doctorId: e.target.value, timeSlotIndex: '' })}
                                    className="w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                >
                                    <option value="">Select Doctor</option>
                                    {doctors?.map(d => (
                                        <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Appointment Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={addForm.appointmentDate}
                                    onChange={(e) => setAddForm({ ...addForm, appointmentDate: e.target.value })}
                                    className="w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Select Time Slot *</label>
                                <select
                                    required
                                    value={addForm.timeSlotIndex}
                                    onChange={(e) => setAddForm({ ...addForm, timeSlotIndex: e.target.value })}
                                    className="w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm capitalize"
                                >
                                    <option value="">Select Slot</option>
                                    {doctorSlots.map((slot, index) => (
                                        <option key={index} value={index}>{slot.day} : {slot.startingTime} - {slot.endingTime}</option>
                                    ))}
                                </select>
                                {addForm.doctorId && doctorSlots.length === 0 && (
                                    <p className="text-red-500 text-xs mt-1">This doctor has no available time slots configured.</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Paid Status</label>
                                    <select
                                        value={addForm.isPaid}
                                        onChange={(e) => setAddForm({ ...addForm, isPaid: e.target.value === 'true' })}
                                        className="w-full py-2 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                    >
                                        <option value="true">Paid</option>
                                        <option value="false">Unpaid</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Visit Completed</label>
                                    <select
                                        value={addForm.visitCompleted}
                                        onChange={(e) => setAddForm({ ...addForm, visitCompleted: e.target.value })}
                                        className="w-full py-2 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                    >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Status</label>
                                <select
                                    value={addForm.status}
                                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                                    className="w-full py-2 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                >
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Admin Remark (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={addForm.remark}
                                    onChange={(e) => setAddForm({ ...addForm, remark: e.target.value })}
                                    className="w-full py-2 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                    placeholder="Enter internal remark..."
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3 border-t dark:border-slate-700 pt-4">
                            <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-200 dark:bg-slate-750 text-textColor dark:text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Cancel</button>
                            <button type="submit" disabled={submitting} className="bg-primaryColor hover:bg-[#0052cc] text-white px-5 py-2.5 rounded-lg font-semibold text-sm">
                                {submitting ? <HashLoader size={20} color="#ffffff" /> : "Save Appointment"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ================= EDIT MODAL ================= */}
            {showEditModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleEditSubmit} className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl border dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b dark:border-slate-700 mb-6">
                            <h3 className="text-xl font-bold text-headingColor dark:text-white">Edit Appointment</h3>
                            <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Appointment Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                >
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Payment Status</label>
                                    <select
                                        value={editForm.isPaid}
                                        onChange={(e) => setEditForm({ ...editForm, isPaid: e.target.value === 'true' })}
                                        className="w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                    >
                                        <option value="true">Paid</option>
                                        <option value="false">Unpaid</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Visit Completed</label>
                                    <select
                                        value={editForm.visitCompleted}
                                        onChange={(e) => setEditForm({ ...editForm, visitCompleted: e.target.value })}
                                        className="w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                    >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Admin Remark</label>
                                <textarea
                                    rows={2}
                                    value={editForm.remark}
                                    onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
                                    className="w-full py-2 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                    placeholder="Enter administrative remark..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Patient Message</label>
                                <textarea
                                    rows={2}
                                    value={editForm.patientMessage}
                                    onChange={(e) => setEditForm({ ...editForm, patientMessage: e.target.value })}
                                    className="w-full py-2 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                    placeholder="Enter patient notes or reasons..."
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3 border-t dark:border-slate-700 pt-4">
                            <button type="button" onClick={() => setShowEditModal(false)} className="bg-slate-200 dark:bg-slate-750 text-textColor dark:text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Cancel</button>
                            <button type="submit" disabled={submitting} className="bg-primaryColor hover:bg-[#0052cc] text-white px-5 py-2.5 rounded-lg font-semibold text-sm">
                                {submitting ? <HashLoader size={20} color="#ffffff" /> : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ================= RESCHEDULE MODAL ================= */}
            {showRescheduleModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleRescheduleSubmit} className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl border dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b dark:border-slate-700 mb-6">
                            <h3 className="text-xl font-bold text-headingColor dark:text-white">Reschedule Appointment</h3>
                            <button type="button" onClick={() => setShowRescheduleModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Appointment Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={rescheduleForm.appointmentDate}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, appointmentDate: e.target.value })}
                                    className="w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-headingColor dark:text-white mb-1">Select Time Slot *</label>
                                <select
                                    required
                                    value={rescheduleForm.timeSlotIndex}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, timeSlotIndex: e.target.value })}
                                    className="w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor text-sm capitalize"
                                >
                                    <option value="">Select Slot</option>
                                    {rescheduleDoctorSlots.map((slot, index) => (
                                        <option key={index} value={index}>{slot.day} : {slot.startingTime} - {slot.endingTime}</option>
                                    ))}
                                </select>
                                {rescheduleDoctorSlots.length === 0 && (
                                    <p className="text-red-500 text-xs mt-1">This doctor has no configured time slots.</p>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3 border-t dark:border-slate-700 pt-4">
                            <button type="button" onClick={() => setShowRescheduleModal(false)} className="bg-slate-200 dark:bg-slate-750 text-textColor dark:text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Cancel</button>
                            <button type="submit" disabled={submitting} className="bg-primaryColor hover:bg-[#0052cc] text-white px-5 py-2.5 rounded-lg font-semibold text-sm">
                                {submitting ? <HashLoader size={20} color="#ffffff" /> : "Reschedule"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
};

export default AppointmentsManagement;
