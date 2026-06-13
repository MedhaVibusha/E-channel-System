import React, { useState, useEffect } from "react";
import { BASE_URL } from "../../config";
import { toast } from "react-toastify";
import { AiOutlineUser, AiOutlineFile, AiOutlineCalendar, AiOutlineClockCircle, AiOutlineCheckCircle, AiOutlineProfile } from "react-icons/ai";
import { dateFormat } from "../../../utils/dateFormat";

const PatientEMR = ({ booking, onConsultationCompleted }) => {
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [patientHistory, setPatientHistory] = useState([]);

  // Load history when booking changes
  useEffect(() => {
    if (booking && booking.user) {
      // Reset charting form for the new patient
      setNotes(booking.consultationNotes || "");
      setDiagnosis(booking.diagnosis || "");
      setPrescription(booking.prescription || "");
      setFollowUpDate(booking.followUpDate || "");
      
      fetchPatientHistory();
    }
  }, [booking]);

  const fetchPatientHistory = async () => {
    if (!booking || !booking.user) return;
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/bookings/patient-history/${booking.user._id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (res.ok) {
        setPatientHistory(result.data || []);
      } else {
        toast.error(result.message || "Failed to load patient history");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching patient history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCompleteConsultation = async (e) => {
    e.preventDefault();
    if (!booking) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/bookings/${booking._id}/consultation`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          consultationNotes: notes,
          diagnosis,
          prescription,
          followUpDate,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      toast.success("Consultation charting saved successfully and appointment marked as completed!");
      
      // Call parent callback to refresh data
      if (onConsultationCompleted) {
        onConsultationCompleted();
      }
      
      // Refresh local history timeline
      fetchPatientHistory();
    } catch (err) {
      toast.error(err.message || "Failed to save consultation");
    } finally {
      setLoading(false);
    }
  };

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

  // If no patient selected, render a placeholder state
  if (!booking || !booking.user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="p-4 bg-indigo-50 text-primaryColor rounded-full mb-4">
          <AiOutlineProfile className="text-[48px]" />
        </div>
        <h3 className="text-[20px] font-bold text-headingColor">EMR Charting Workspace</h3>
        <p className="text-textColor text-sm mt-2 text-center max-w-md">
          Please select a patient from the <strong>Appointments</strong> tab by clicking <strong>"Select for EMR"</strong> to begin clinical charting, view records, and check patient history.
        </p>
      </div>
    );
  }

  const patient = booking.user;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT COLUMN: Patient Info & Documents (5/12) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-5 mb-5">
            {patient.photo ? (
              <img
                src={patient.photo}
                alt={patient.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primaryColor"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-textColor text-[20px]">
                {patient.name?.substring(0, 2).toUpperCase() || "PT"}
              </div>
            )}
            <div>
              <span className="bg-[#e0f2fe] text-primaryColor font-bold text-[11px] px-2 py-0.5 rounded">
                PATIENT PROFILE
              </span>
              <h3 className="text-[18px] font-bold text-headingColor mt-1">{patient.name}</h3>
              <p className="text-xs text-textColor">{patient.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-textColor block">Age</span>
              <span className="font-bold text-headingColor text-sm mt-0.5 block">{patient.age || "N/A"} years</span>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-textColor block">Gender</span>
              <span className="font-bold text-headingColor text-sm mt-0.5 block capitalize">{patient.gender || "N/A"}</span>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-textColor block">Contact</span>
              <span className="font-bold text-headingColor text-sm mt-0.5 block">{patient.phone || "N/A"}</span>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-textColor block">Blood Group</span>
              <span className="font-bold text-red-600 text-sm mt-0.5 block">{patient.bloodType || "N/A"}</span>
            </div>
          </div>

          <div className="mt-5 space-y-3.5">
            <div>
              <span className="text-[11px] font-bold uppercase text-textColor block">Address</span>
              <p className="text-xs text-headingColor bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-1">
                {patient.address || "No physical address provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Clinical History details */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
          <h4 className="text-[15px] font-bold text-headingColor border-b border-gray-100 pb-2">
            Clinical History Summary
          </h4>
          
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-red-600 block uppercase">Allergies</span>
              <div className="text-xs text-headingColor bg-red-50/50 border border-red-100 p-2.5 rounded-lg mt-1 min-h-[40px] italic">
                {patient.allergies || "No known allergies listed."}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-600 block uppercase">Chronic Diseases</span>
              <div className="text-xs text-headingColor bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg mt-1 min-h-[40px] italic">
                {patient.chronicDiseases || "No chronic diseases listed."}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-600 block uppercase">Previous Surgeries</span>
              <div className="text-xs text-headingColor bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-lg mt-1 min-h-[40px] italic">
                {patient.previousSurgeries || "No operations/surgeries listed."}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 block uppercase">Current Medications</span>
              <div className="text-xs text-headingColor bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg mt-1 min-h-[40px] italic">
                {patient.currentMedications || "No current medications listed."}
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded medical reports */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h4 className="text-[15px] font-bold text-headingColor border-b border-gray-100 pb-2 mb-3">
            Patient Medical Reports ({patient.medicalReports?.length || 0})
          </h4>
          {patient.medicalReports && patient.medicalReports.length > 0 ? (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {patient.medicalReports.map((reportUrl, idx) => (
                <a
                  key={idx}
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-all text-xs text-primaryColor font-medium truncate"
                >
                  <div className="flex items-center gap-2 truncate">
                    <AiOutlineFile className="text-[18px] text-gray-500 shrink-0" />
                    <span className="truncate">{getFileName(reportUrl)}</span>
                  </div>
                  <span className="text-[10px] text-textColor shrink-0 hover:underline">View File</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-textColor italic text-center py-4">No uploaded medical documents.</p>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: EMR Form & Medical History Timeline (7/12) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Consultation Charting Form */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h4 className="text-[16px] font-bold text-headingColor flex items-center gap-2">
              <span className="p-1.5 bg-primaryColor/10 text-primaryColor rounded-lg text-xs">🩺</span>
              Consultation Charting
            </h4>
            <div className="text-right text-xs">
              <span className="text-textColor block">Active Appointment</span>
              <span className="font-mono font-bold text-primaryColor">{booking.appointmentId}</span>
            </div>
          </div>

          <form onSubmit={handleCompleteConsultation} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase text-headingColor block mb-1">
                Consultation Notes *
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter clinical symptoms, observation findings, physical exams..."
                rows={4}
                required
                className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primaryColor text-headingColor"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-headingColor block mb-1">
                Diagnosis *
              </label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter diagnostic assessments, ICD codes, clinical impressions..."
                rows={2}
                required
                className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primaryColor text-headingColor"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-headingColor block mb-1">
                Prescription (Medicines, dosage, instructions)
              </label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Example: Paracetamol 500mg - 1 tablet - 3 times daily after meals for 5 days."
                rows={4}
                className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primaryColor text-headingColor font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-headingColor block mb-1">
                  Recommend Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primaryColor text-headingColor"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:bg-emerald-300"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Complete Consultation & Save"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Patient Medical History Timeline */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h4 className="text-[16px] font-bold text-headingColor border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-primaryColor rounded-lg text-xs">📋</span>
            Patient EMR History Timeline
          </h4>

          {historyLoading ? (
            <div className="flex justify-center py-6">
              <svg className="animate-spin h-6 w-6 text-primaryColor" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : patientHistory.length > 0 ? (
            <div className="relative border-l border-gray-200 ml-4 space-y-6">
              {patientHistory.map((item, idx) => (
                <div key={item._id} className="relative pl-6">
                  {/* Timeline Dot */}
                  <span className="absolute -left-[6px] top-1 bg-primaryColor border-2 border-white w-3 h-3 rounded-full"></span>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200/50 pb-1.5 gap-1">
                      <span className="text-[11px] font-bold text-headingColor flex items-center gap-1">
                        <AiOutlineCalendar className="text-[14px] text-gray-500" />
                        {dateFormat(item.appointmentDate || item.createdAt)}
                      </span>
                      <span className="text-[10px] bg-indigo-100 text-primaryColor font-bold px-2 py-0.5 rounded-full">
                        Doctor: {item.doctor?.name || "SabraCare MD"}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <strong className="text-gray-700 block text-[11px] uppercase">Diagnosis:</strong>
                        <p className="text-headingColor bg-white p-2 rounded border border-gray-200 mt-0.5">
                          {item.diagnosis || "No diagnosis logged."}
                        </p>
                      </div>
                      <div>
                        <strong className="text-gray-700 block text-[11px] uppercase">Prescription:</strong>
                        <p className="text-headingColor bg-white p-2 rounded border border-gray-200 mt-0.5 font-mono">
                          {item.prescription || "No medicines prescribed."}
                        </p>
                      </div>
                      <div>
                        <strong className="text-gray-700 block text-[11px] uppercase">Notes:</strong>
                        <p className="text-textColor italic mt-0.5">
                          "{item.consultationNotes || "No notes logged."}"
                        </p>
                      </div>
                      {item.followUpDate && (
                        <div className="text-[10px] text-emerald-600 font-bold mt-1">
                          ↳ Follow-up recommended on: {dateFormat(item.followUpDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-textColor italic text-center py-6">No previous completed consultation history found.</p>
          )}
        </div>

      </div>

    </div>
  );
};

export default PatientEMR;
