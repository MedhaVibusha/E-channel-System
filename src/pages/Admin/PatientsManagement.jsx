import React, { useState, useEffect } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import HashLoader from 'react-spinners/HashLoader';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUserCheck, FaUserPlus, FaSearch, FaEye, FaEdit } from 'react-icons/fa';
import { AiOutlineClose, AiOutlineCloudUpload, AiOutlineDelete, AiOutlineFile } from 'react-icons/ai';
import uploadImageToCloudinary from '../../../utils/uploadImageToCloudinary';

const PatientsManagement = () => {
    const { data: patientsData, loading, error, refetch } = useFetchData(`${BASE_URL}/admin/patients`);
    const [searchTerm, setSearchTerm] = useState('');
    const [patientList, setPatientList] = useState([]);

    // Modal states
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Detailed patient view state
    const [detailedPatient, setDetailedPatient] = useState(null);
    const [detailedAppointments, setDetailedAppointments] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const handlePatientClick = async (patientId) => {
        setLoadingDetails(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/admin/patients/${patientId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const result = await res.json();
            if (res.ok) {
                setDetailedPatient(result.data.patient);
                setDetailedAppointments(result.data.appointments || []);
            } else {
                toast.error(result.message || "Failed to load patient details");
            }
        } catch (err) {
            toast.error("Error loading patient details");
        } finally {
            setLoadingDetails(false);
        }
    };

    // View Modal Tab state
    const [activeTab, setActiveTab] = useState('personal');

    // Edit form states
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        phone: "",
        gender: "",
        bloodType: "",
        dob: "",
        age: "",
        address: "",
        allergies: "",
        chronicDiseases: "",
        previousSurgeries: "",
        currentMedications: "",
        medicalReports: [],
        photo: "",
        status: "active"
    });

    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingReport, setUploadingReport] = useState(false);
    const [saving, setSaving] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (patientsData) {
            setPatientList(patientsData);
        }
    }, [patientsData]);

    // Format DOB to YYYY-MM-DD for date inputs
    const formatDate = (dateVal) => {
        if (!dateVal) return "";
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return "";
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return "";
        }
    };

    // Calculate Age
    const calculateAge = (dobString) => {
        if (!dobString) return "";
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return "";
        const today = new Date();
        let calculatedAge = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            calculatedAge--;
        }
        return calculatedAge >= 0 ? calculatedAge : 0;
    };

    // Quick Stats Calculation
    const totalPatientsCount = patientList.length;
    const activePatientsCount = patientList.filter(p => p.status !== 'inactive').length;

    const newPatientsThisMonthCount = patientList.filter(p => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Filter patients by search term
    const filteredPatients = patientList.filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Toggle Account Status
    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/admin/patients/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            toast.success("Patient status updated successfully");
            setPatientList(prev => prev.map(p => p._id === id ? { ...p, status: newStatus } : p));
        } catch (err) {
            toast.error(err.message || "Failed to update status");
        }
    };

    // Open View Modal
    const openViewModal = (patient) => {
        setSelectedPatient(patient);
        setActiveTab('personal');
        setShowViewModal(true);
    };

    // Open Edit Modal
    const openEditModal = (patient) => {
        setSelectedPatient(patient);

        // Sanitize phone number to get raw 9 digits for form
        let initialPhone = patient.phone ? String(patient.phone).trim() : "";
        if (initialPhone.startsWith("+94")) {
            initialPhone = initialPhone.substring(3);
        } else if (initialPhone.startsWith("94")) {
            initialPhone = initialPhone.substring(2);
        } else if (initialPhone.startsWith("0")) {
            initialPhone = initialPhone.substring(1);
        }
        initialPhone = initialPhone.replace(/\D/g, "").substring(0, 9);

        setEditForm({
            name: patient.name || "",
            email: patient.email || "",
            phone: initialPhone,
            gender: patient.gender || "",
            bloodType: patient.bloodType || "",
            dob: formatDate(patient.dob),
            age: patient.age || (patient.dob ? calculateAge(patient.dob) : ""),
            address: patient.address || "",
            allergies: patient.allergies || "",
            chronicDiseases: patient.chronicDiseases || "",
            previousSurgeries: patient.previousSurgeries || "",
            currentMedications: patient.currentMedications || "",
            medicalReports: patient.medicalReports || [],
            photo: patient.photo || "",
            status: patient.status || "active"
        });
        setShowEditModal(true);
    };

    // Handle Edit Inputs
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "dob") {
            const calculatedAge = calculateAge(value);
            setEditForm({ ...editForm, dob: value, age: calculatedAge });
        } else {
            setEditForm({ ...editForm, [name]: value });
        }
    };

    const handlePhoneInputChange = (e) => {
        const value = e.target.value.replace(/\D/g, ""); // Allow only digits
        if (value.length <= 9) {
            setEditForm({ ...editForm, phone: value });
        }
    };

    // Upload Photo
    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const data = await uploadImageToCloudinary(file);
            setEditForm(prev => ({ ...prev, photo: data.url }));
            toast.success("Photo uploaded successfully");
        } catch (err) {
            toast.error("Failed to upload photo");
        } finally {
            setUploadingPhoto(false);
        }
    };

    // Upload Medical Report
    const handleReportUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingReport(true);
        try {
            const data = await uploadImageToCloudinary(file);
            setEditForm(prev => ({
                ...prev,
                medicalReports: [...(prev.medicalReports || []), data.url]
            }));
            toast.success("Medical report uploaded");
        } catch (err) {
            toast.error("Failed to upload report");
        } finally {
            setUploadingReport(false);
        }
    };

    // Delete Medical Report
    const deleteReport = (indexToDelete) => {
        setEditForm(prev => ({
            ...prev,
            medicalReports: prev.medicalReports.filter((_, idx) => idx !== indexToDelete)
        }));
        toast.success("Medical report removed");
    };

    // Submit Edit Form
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (editForm.phone && editForm.phone.length !== 9) {
            toast.error("Contact number must be exactly 9 digits.");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const submissionData = {
                ...editForm,
                phone: editForm.phone ? `+94${editForm.phone}` : ""
            };

            const res = await fetch(`${BASE_URL}/admin/patients/${selectedPatient._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(submissionData)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            toast.success("Patient details updated successfully");
            setShowEditModal(false);
            refetch(); // Reload details from backend
        } catch (err) {
            toast.error(err.message || "Failed to save details");
        } finally {
            setSaving(false);
        }
    };

    // Extract filename from URL
    const getFileName = (url) => {
        if (!url) return "";
        try {
            const decodedUrl = decodeURIComponent(url);
            const parts = decodedUrl.split("/");
            const lastPart = parts[parts.length - 1];
            return lastPart.split("?")[0];
        } catch (e) {
            return "Medical Report Document";
        }
    };

    if (loadingDetails) {
        return (
            <div className="flex justify-center items-center h-60">
                <HashLoader size={45} color="#0067FF" />
            </div>
        );
    }

    if (detailedPatient) {
        return (
            <section className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-panelShadow border border-gray-100 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-slate-700 gap-4">
                        <div className="flex items-center gap-4">
                            <img src={detailedPatient.photo || 'https://via.placeholder.com/100'} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primaryColor" />
                            <div>
                                <h2 className="text-2xl font-bold text-headingColor dark:text-white">{detailedPatient.name}</h2>
                                <p className="text-sm text-textColor dark:text-gray-400">Patient ID: <span className="font-mono font-bold text-primaryColor">{detailedPatient.patientId || 'N/A'}</span></p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setDetailedPatient(null)} 
                            className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-headingColor dark:text-white px-5 py-2 rounded-lg font-semibold transition-colors w-full sm:w-auto"
                        >
                            &larr; Back to List
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Personal Details */}
                        <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-headingColor dark:text-white mb-4 border-b pb-2">Personal Details</h3>
                            <div className="space-y-3">
                                <p className="text-textColor dark:text-gray-300"><strong className="text-headingColor dark:text-white">Gender:</strong> <span className="capitalize">{detailedPatient.gender || 'N/A'}</span></p>
                                <p className="text-textColor dark:text-gray-300"><strong className="text-headingColor dark:text-white">Date of Birth:</strong> {detailedPatient.dob ? new Date(detailedPatient.dob).toLocaleDateString() : 'N/A'}</p>
                                <p className="text-textColor dark:text-gray-300"><strong className="text-headingColor dark:text-white">Age:</strong> {detailedPatient.age || (detailedPatient.dob ? calculateAge(detailedPatient.dob) : 'N/A')}</p>
                                <p className="text-textColor dark:text-gray-300"><strong className="text-headingColor dark:text-white">Contact Number:</strong> {detailedPatient.phone || 'N/A'}</p>
                                <p className="text-textColor dark:text-gray-300"><strong className="text-headingColor dark:text-white">Email:</strong> {detailedPatient.email}</p>
                                <p className="text-textColor dark:text-gray-300"><strong className="text-headingColor dark:text-white">Address:</strong> {detailedPatient.address || 'N/A'}</p>
                                <p className="text-textColor dark:text-gray-300"><strong className="text-headingColor dark:text-white">Registration Date:</strong> {new Date(detailedPatient.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Medical Details */}
                        <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-headingColor dark:text-white mb-4 border-b pb-2">Medical History & Clinical Profile</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Blood Group</h4>
                                    <p className="font-bold text-primaryColor text-base">{detailedPatient.bloodType || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Allergies</h4>
                                    <p className="font-semibold text-headingColor dark:text-gray-200">{detailedPatient.allergies || 'None recorded'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Chronic Diseases</h4>
                                    <p className="font-semibold text-headingColor dark:text-gray-200">{detailedPatient.chronicDiseases || 'None recorded'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Previous Operations / Surgeries</h4>
                                    <p className="font-semibold text-headingColor dark:text-gray-200">{detailedPatient.previousSurgeries || 'None recorded'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Current Medications</h4>
                                    <p className="font-semibold text-headingColor dark:text-gray-200">{detailedPatient.currentMedications || 'None recorded'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appointment History */}
                    <div>
                        <h3 className="text-xl font-bold text-headingColor dark:text-white mb-4">Appointment History</h3>
                        <div className="overflow-x-auto border border-gray-100 dark:border-slate-700 rounded-lg">
                            <table className="w-full text-left">
                                <thead className="bg-[#f4f7ff] dark:bg-slate-750 text-textColor dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-sm">Appointment ID</th>
                                        <th className="px-4 py-3 font-semibold text-sm">Doctor</th>
                                        <th className="px-4 py-3 font-semibold text-sm">Speciality</th>
                                        <th className="px-4 py-3 font-semibold text-sm">Date & Time</th>
                                        <th className="px-4 py-3 font-semibold text-sm">Status</th>
                                        <th className="px-4 py-3 font-semibold text-sm">Payment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailedAppointments.length > 0 ? (
                                        detailedAppointments.map((appt) => (
                                            <tr key={appt._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-sm">
                                                <td className="px-4 py-3 font-mono font-bold text-xs text-primaryColor">{appt.appointmentId || 'N/A'}</td>
                                                <td className="px-4 py-3 font-semibold text-headingColor dark:text-white">{appt.doctor?.name || 'Unknown'}</td>
                                                <td className="px-4 py-3 text-textColor dark:text-gray-300 capitalize">{appt.doctor?.specialization?.replace('-', ' ') || 'N/A'}</td>
                                                <td className="px-4 py-3 text-textColor dark:text-gray-300">
                                                    {appt.appointmentTime ? `${appt.appointmentTime.day} | ${appt.appointmentTime.startingTime} - ${appt.appointmentTime.endingTime}` : 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        appt.status === 'Completed' || appt.status === 'Confirmed' || appt.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {appt.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${appt.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {appt.isPaid ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-6 text-textColor dark:text-gray-400 italic">No appointments booked yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
            {/* Quick Statistics (Top of Page) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Patients Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-panelShadow border border-gray-100 dark:border-slate-700 flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="bg-blue-100 dark:bg-blue-900 text-primaryColor dark:text-blue-200 p-4 rounded-full text-3xl">
                        <FaUsers />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-textColor dark:text-gray-300">Total Patients</p>
                        <h3 className="text-2xl font-bold text-headingColor dark:text-white mt-1">{totalPatientsCount}</h3>
                    </div>
                </div>

                {/* Active Patients Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-panelShadow border border-gray-100 dark:border-slate-700 flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 p-4 rounded-full text-3xl">
                        <FaUserCheck />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-textColor dark:text-gray-300">Active Patients</p>
                        <h3 className="text-2xl font-bold text-headingColor dark:text-white mt-1">{activePatientsCount}</h3>
                    </div>
                </div>

                {/* New Patients Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-panelShadow border border-gray-100 dark:border-slate-700 flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 p-4 rounded-full text-3xl">
                        <FaUserPlus />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-textColor dark:text-gray-300">New Patients This Month</p>
                        <h3 className="text-2xl font-bold text-headingColor dark:text-white mt-1">{newPatientsThisMonthCount}</h3>
                    </div>
                </div>
            </div>

            {/* Header controls: Search & Add Button */}
            <div className="flex flex-col gap-4 md:flex-row items-center justify-between mb-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-panelShadow border border-gray-100 dark:border-slate-700">
                <div className="relative w-full md:w-[400px]">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-textColor dark:text-gray-400">
                        <FaSearch />
                    </span>
                    <input
                        type="search"
                        placeholder="Search patient by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-4 bg-slate-50 dark:bg-slate-700 text-headingColor dark:text-white placeholder:text-textColor dark:placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryColor transition-all border border-gray-200 dark:border-slate-600"
                    />
                </div>
                <button
                    onClick={() => navigate('/register?role=patient')}
                    className="w-full md:w-auto bg-primaryColor text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#0052cc] transition-colors whitespace-nowrap shadow-sm"
                >
                    + Add Patient
                </button>
            </div>

            {/* Loading / Error / Table states */}
            {loading && (
                <div className="flex justify-center items-center h-60">
                    <HashLoader size={45} color="#0067FF" />
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                    <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="bg-white dark:bg-slate-800 shadow-panelShadow rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-700 text-textColor dark:text-gray-300 border-b border-gray-200 dark:border-slate-600">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Patient ID</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Name</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Age</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Gender</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Contact No</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase">Status</th>
                                    <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map((patient) => (
                                    <tr key={patient._id} className="border-b dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                                        {/* Patient ID */}
                                        <td className="px-6 py-4 font-mono font-bold text-xs text-primaryColor">
                                            {patient.patientId || 'N/A'}
                                        </td>
                                        {/* Name with Photo */}
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <img src={patient.photo || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                            <div>
                                                <span className="font-semibold text-headingColor dark:text-white block hover:text-primaryColor cursor-pointer hover:underline" onClick={() => handlePatientClick(patient._id)}>{patient.name}</span>
                                                <span className="text-xs text-textColor dark:text-gray-400 block">{patient.email}</span>
                                            </div>
                                        </td>

                                        {/* Age */}
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300 font-medium">
                                            {patient.age || (patient.dob ? calculateAge(patient.dob) : 'N/A')}
                                        </td>

                                        {/* Gender */}
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300 capitalize font-medium">
                                            {patient.gender || 'N/A'}
                                        </td>

                                        {/* Contact No */}
                                        <td className="px-6 py-4 text-textColor dark:text-gray-300 font-medium">
                                            {patient.phone || 'N/A'}
                                        </td>

                                        {/* Status Activate/Deactivate select */}
                                        <td className="px-6 py-4">
                                            <select
                                                value={patient.status || 'active'}
                                                onChange={(e) => handleStatusChange(patient._id, e.target.value)}
                                                className={`px-3 py-1.5 rounded-lg border-0 font-bold text-xs cursor-pointer outline-none focus:ring-2 focus:ring-primaryColor transition-all ${patient.status !== 'inactive' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                                    }`}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => openEditModal(patient)}
                                                    className="bg-orange-50 hover:bg-orange-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-orange-600 dark:text-orange-300 p-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 font-semibold text-xs py-1.5 px-3"
                                                    title="Edit Information"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredPatients.length === 0 && (
                            <div className="p-8 text-center text-textColor dark:text-gray-400">
                                No patients found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= VIEW MODAL ================= */}
            {showViewModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <img src={selectedPatient.photo || 'https://via.placeholder.com/40'} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-primaryColor" />
                                <div>
                                    <h3 className="text-xl font-bold text-headingColor dark:text-white leading-tight">{selectedPatient.name}</h3>
                                    <span className="text-sm text-textColor dark:text-gray-400">{selectedPatient.email}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <AiOutlineClose className="text-2xl" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-slate-700 px-6 bg-slate-50/50 dark:bg-slate-800/50">
                            {['personal', 'medical', 'clinical', 'documents'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all capitalize -mb-px ${activeTab === tab
                                            ? 'border-primaryColor text-primaryColor'
                                            : 'border-transparent text-textColor hover:text-headingColor dark:text-gray-400 dark:hover:text-white'
                                        }`}
                                >
                                    {tab === 'personal' ? 'Personal Details' :
                                        tab === 'medical' ? 'Medical details' :
                                            tab === 'clinical' ? 'Clinical History' : 'Medical reports'}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 text-sm text-textColor dark:text-gray-300">

                            {/* Personal Details Tab */}
                            {activeTab === 'personal' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                                        <p className="font-semibold text-headingColor dark:text-white">{selectedPatient.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                                        <p className="font-semibold text-headingColor dark:text-white">{selectedPatient.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Contact Number</label>
                                        <p className="font-semibold text-headingColor dark:text-white">{selectedPatient.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Gender</label>
                                        <p className="font-semibold text-headingColor dark:text-white capitalize">{selectedPatient.gender || 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Physical Address</label>
                                        <p className="font-semibold text-headingColor dark:text-white">{selectedPatient.address || 'N/A'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Medical Details Tab */}
                            {activeTab === 'medical' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Blood Group</label>
                                        <p className="font-semibold text-headingColor dark:text-white">{selectedPatient.bloodType || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date of Birth</label>
                                        <p className="font-semibold text-headingColor dark:text-white">
                                            {selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Age</label>
                                        <p className="font-semibold text-headingColor dark:text-white">
                                            {selectedPatient.age || (selectedPatient.dob ? calculateAge(selectedPatient.dob) : 'N/A')}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${selectedPatient.status !== 'inactive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {selectedPatient.status !== 'inactive' ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Clinical History Tab */}
                            {activeTab === 'clinical' && (
                                <div className="space-y-5">
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Allergies</label>
                                        <p className="font-semibold text-headingColor dark:text-white whitespace-pre-wrap">{selectedPatient.allergies || 'No allergies recorded.'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Chronic Diseases</label>
                                        <p className="font-semibold text-headingColor dark:text-white whitespace-pre-wrap">{selectedPatient.chronicDiseases || 'No chronic diseases recorded.'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Previous Operations / Surgeries</label>
                                        <p className="font-semibold text-headingColor dark:text-white whitespace-pre-wrap">{selectedPatient.previousSurgeries || 'No previous surgeries recorded.'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Current Medications</label>
                                        <p className="font-semibold text-headingColor dark:text-white whitespace-pre-wrap">{selectedPatient.currentMedications || 'No current medications recorded.'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Medical Documents Tab */}
                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    {selectedPatient.medicalReports && selectedPatient.medicalReports.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedPatient.medicalReports.map((reportUrl, index) => (
                                                <div key={index} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:border-primaryColor transition-all">
                                                    <a
                                                        href={reportUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 text-primaryColor dark:text-blue-300 font-semibold hover:underline truncate max-w-[85%]"
                                                    >
                                                        <AiOutlineFile className="text-[22px] text-gray-500 shrink-0" />
                                                        <span className="truncate">{getFileName(reportUrl)}</span>
                                                    </a>
                                                    <a
                                                        href={reportUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs bg-primaryColor text-white px-3 py-1.5 rounded-lg hover:bg-[#0052cc] font-semibold"
                                                    >
                                                        Open
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="italic text-center py-6 text-gray-400">No medical reports uploaded yet.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end bg-slate-50/50 dark:bg-slate-800/50">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    openEditModal(selectedPatient);
                                }}
                                className="bg-primaryColor hover:bg-[#0052cc] text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors mr-3"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-650 text-headingColor dark:text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= EDIT MODAL ================= */}
            {showEditModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleEditSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                            <div>
                                <h3 className="text-xl font-bold text-headingColor dark:text-white">Edit Patient Information</h3>
                                <p className="text-sm text-textColor dark:text-gray-400 mt-0.5">Modify information for {editForm.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <AiOutlineClose className="text-2xl" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-textColor dark:text-gray-300">

                            {/* Section 1: Personal Details */}
                            <div>
                                <h4 className="font-bold text-headingColor dark:text-white text-base border-b border-solid border-[#0066ff12] pb-2 mb-4">1. Personal Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-semibold mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editForm.name}
                                            onChange={handleEditInputChange}
                                            required
                                            className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-650 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold mb-1 text-gray-400">Email Address (Read-only)</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            disabled
                                            className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-slate-800 dark:border-slate-700 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold mb-1">Contact Number *</label>
                                        <div className="flex">
                                            <span className="bg-gray-200 dark:bg-slate-600 dark:text-gray-200 border border-r-0 rounded-l-lg px-3 py-2 flex items-center font-semibold text-headingColor">+94</span>
                                            <input
                                                type="text"
                                                placeholder="7XXXXXXXX"
                                                value={editForm.phone}
                                                onChange={handlePhoneInputChange}
                                                maxLength={9}
                                                required
                                                className="w-full px-4 py-2 border rounded-r-lg dark:bg-slate-700 dark:border-slate-650 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-semibold mb-1">Physical Address *</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={editForm.address}
                                            onChange={handleEditInputChange}
                                            required
                                            className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-650 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                        />
                                    </div>

                                    {/* Upload Photo */}
                                    <div className="md:col-span-2 flex items-center gap-4 mt-2">
                                        {editForm.photo && (
                                            <figure className="w-[50px] h-[50px] rounded-full border-2 border-solid border-primaryColor flex items-center justify-center shrink-0">
                                                <img src={editForm.photo} alt="" className="w-full h-full rounded-full object-cover" />
                                            </figure>
                                        )}
                                        <div className="relative w-[130px] h-[40px]">
                                            <input
                                                type="file"
                                                onChange={handlePhotoUpload}
                                                accept=".jpg, .png, .jpeg"
                                                id="photo-upload"
                                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <label
                                                htmlFor="photo-upload"
                                                className="absolute top-0 left-0 w-full h-full flex items-center justify-center gap-1.5 bg-[#0066ff26] hover:bg-[#0066ff3a] text-primaryColor font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                                            >
                                                {uploadingPhoto ? <HashLoader size={16} color="#0066ff" /> : <><AiOutlineCloudUpload className="text-lg" /> Upload Photo</>}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Medical Details */}
                            <div>
                                <h4 className="font-bold text-headingColor dark:text-white text-base border-b border-solid border-[#0066ff12] pb-2 mb-4">2. Medical Details</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block font-semibold mb-1">Blood Group *</label>
                                        <select
                                            name="bloodType"
                                            value={editForm.bloodType}
                                            onChange={handleEditInputChange}
                                            required
                                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-650 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                        >
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-semibold mb-1">Gender *</label>
                                        <select
                                            name="gender"
                                            value={editForm.gender}
                                            onChange={handleEditInputChange}
                                            required
                                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-650 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-semibold mb-1">Date of Birth *</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            value={editForm.dob}
                                            onChange={handleEditInputChange}
                                            required
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-650 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold mb-1 text-gray-400">Age (Calculated)</label>
                                        <input
                                            type="number"
                                            value={editForm.age}
                                            disabled
                                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-slate-800 dark:border-slate-700 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Clinical History */}
                            <div>
                                <h4 className="font-bold text-headingColor dark:text-white text-base border-b border-solid border-[#0066ff12] pb-2 mb-4">3. Clinical History</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block font-semibold mb-1">Allergies</label>
                                        <textarea
                                            name="allergies"
                                            value={editForm.allergies}
                                            onChange={handleEditInputChange}
                                            placeholder="List any known allergies..."
                                            rows={2}
                                            className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-650 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold mb-1">Chronic Diseases</label>
                                        <textarea
                                            name="chronicDiseases"
                                            value={editForm.chronicDiseases}
                                            onChange={handleEditInputChange}
                                            placeholder="List any chronic medical conditions..."
                                            rows={2}
                                            className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-650 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold mb-1">Previous Operations / Surgeries</label>
                                        <textarea
                                            name="previousSurgeries"
                                            value={editForm.previousSurgeries}
                                            onChange={handleEditInputChange}
                                            placeholder="List any previous operations or surgical procedures..."
                                            rows={2}
                                            className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-650 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold mb-1">Current Medications</label>
                                        <textarea
                                            name="currentMedications"
                                            value={editForm.currentMedications}
                                            onChange={handleEditInputChange}
                                            placeholder="List any current medications..."
                                            rows={2}
                                            className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-650 dark:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Medical Documents */}
                            <div>
                                <h4 className="font-bold text-headingColor dark:text-white text-base border-b border-solid border-[#0066ff12] pb-2 mb-4">4. Medical Reports</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-[180px] h-[40px]">
                                            <input
                                                type="file"
                                                onChange={handleReportUpload}
                                                accept=".jpg, .png, .jpeg, .pdf"
                                                id="report-upload"
                                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <label
                                                htmlFor="report-upload"
                                                className="absolute top-0 left-0 w-full h-full flex items-center justify-center gap-1.5 bg-[#0066ff26] hover:bg-[#0066ff3a] text-primaryColor font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                                            >
                                                {uploadingReport ? <HashLoader size={16} color="#0066ff" /> : <><AiOutlineCloudUpload className="text-lg" /> Upload Report</>}
                                            </label>
                                        </div>
                                        <span className="text-xs text-textColor">Supports PDF, JPG, PNG formats.</span>
                                    </div>

                                    {/* Uploaded reports list */}
                                    {editForm.medicalReports && editForm.medicalReports.length > 0 ? (
                                        <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800 border-gray-150 dark:border-slate-700 max-h-[200px] overflow-y-auto space-y-2">
                                            {editForm.medicalReports.map((reportUrl, index) => (
                                                <div key={index} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600 shadow-xs">
                                                    <a
                                                        href={reportUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primaryColor dark:text-blue-300 font-semibold hover:underline text-xs truncate max-w-[80%] flex items-center gap-1.5"
                                                    >
                                                        <AiOutlineFile className="shrink-0 text-base" />
                                                        <span className="truncate">{getFileName(reportUrl)}</span>
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteReport(index)}
                                                        className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-1.5 rounded-full transition-colors"
                                                        title="Remove report"
                                                    >
                                                        <AiOutlineDelete className="text-sm" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs italic text-gray-400">No medical reports uploaded yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end bg-slate-50/50 dark:bg-slate-800/50">
                            <button
                                type="submit"
                                disabled={saving || uploadingPhoto || uploadingReport}
                                className="bg-primaryColor hover:bg-[#0052cc] text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-colors mr-3 flex items-center gap-2"
                            >
                                {saving ? <HashLoader size={18} color="#ffffff" /> : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-650 text-headingColor dark:text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
};

export default PatientsManagement;
