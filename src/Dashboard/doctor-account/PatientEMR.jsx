/* eslint-disable react/prop-types, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../../config";
import { toast } from "react-toastify";
import {
  AiOutlineArrowLeft,
  AiOutlineCalendar,
  AiOutlineCheckCircle,
  AiOutlineFile,
  AiOutlineSearch,
} from "react-icons/ai";
import { dateFormat } from "../../../utils/dateFormat";
import convertTime from "../../../utils/convertTime";

const emptyTreatmentForm = {
  symptoms: "",
  diagnosis: "",
  clinicalNotes: "",
  treatmentPlan: "",
  prescription: "",
  followUpDate: "",
};

const PatientEMR = ({ booking, onConsultationCompleted }) => {
  const [selectedAction, setSelectedAction] = useState("list");
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalProfile, setClinicalProfile] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(emptyTreatmentForm);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (booking?.user) {
      openPatient(booking.user, "treat", booking);
    }
  }, [booking]);

  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/clinical-patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to load patients");
      setPatients(result.data || []);
    } catch (error) {
      toast.error(error.message || "Error fetching patients");
    } finally {
      setPatientsLoading(false);
    }
  };

  const fetchClinicalProfile = async (patientId) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/clinical-patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to load clinical profile");
      setClinicalProfile(result.data);
      return result.data;
    } catch (error) {
      toast.error(error.message || "Error fetching clinical profile");
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const openPatient = async (patient, action, selectedBooking = null) => {
    setSelectedPatient(patient);
    setCurrentBooking(selectedBooking);
    setSelectedAction(action);

    const profile = await fetchClinicalProfile(patient._id);
    const profilePatient = profile?.patient || patient;
    setSelectedPatient(profilePatient);

    if (action === "treat") {
      const latestOpenBooking = profile?.appointments?.find(
        (item) => item.status !== "Completed" && item.status !== "Cancelled" && item.status !== "cancelled"
      );
      const treatmentBooking = selectedBooking || latestOpenBooking || null;
      setCurrentBooking(treatmentBooking);
      setForm({
        symptoms: treatmentBooking?.symptoms || "",
        diagnosis: treatmentBooking?.diagnosis || "",
        clinicalNotes: treatmentBooking?.clinicalNotes || treatmentBooking?.consultationNotes || "",
        treatmentPlan: treatmentBooking?.treatmentPlan || "",
        prescription: treatmentBooking?.prescription || "",
        followUpDate: treatmentBooking?.followUpDate || "",
      });
    }
  };

  const handleBackToList = () => {
    setSelectedAction("list");
    setSelectedPatient(null);
    setClinicalProfile(null);
    setCurrentBooking(null);
    setForm(emptyTreatmentForm);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveTreatment = async (completeVisit) => {
    if (!selectedPatient?._id) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/bookings/clinical-patients/${selectedPatient._id}/treatment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          bookingId: currentBooking?._id,
          completeVisit,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to save treatment");

      toast.success(result.message || "Treatment chart saved");
      setCurrentBooking(result.data);
      await fetchClinicalProfile(selectedPatient._id);
      if (onConsultationCompleted) onConsultationCompleted();
    } catch (error) {
      toast.error(error.message || "Failed to save treatment");
    } finally {
      setSaving(false);
    }
  };

  const getFileName = (url) => {
    if (!url) return "Medical Document";
    try {
      const decodedUrl = decodeURIComponent(url);
      const parts = decodedUrl.split("/");
      return parts[parts.length - 1].split("?")[0] || "Medical Document";
    } catch (error) {
      return "Medical Document";
    }
  };

  const formatDob = (dob) => (dob ? dateFormat(dob) : "N/A");

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter((patient) => {
      return (
        patient.name?.toLowerCase().includes(term) ||
        patient.email?.toLowerCase().includes(term) ||
        patient.phone?.toLowerCase().includes(term) ||
        patient.patientId?.toLowerCase().includes(term)
      );
    });
  }, [patients, searchTerm]);

  const patient = selectedPatient || clinicalProfile?.patient || {};
  const appointments = clinicalProfile?.appointments || [];
  const reports = clinicalProfile?.uploadedReports || patient.medicalReports || [];

  if (selectedAction === "list") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 pb-5">
          <div>
            <h3 className="text-[20px] font-bold text-headingColor">Clinical History Directory</h3>
            <p className="text-xs text-textColor mt-1">
              Registered patients are shown once for profile review and treatment charting.
            </p>
          </div>
          <div className="relative w-full md:w-[350px]">
            <input
              type="text"
              placeholder="Search name, email, phone, or patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs p-3 pl-10 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-headingColor bg-gray-50/50"
            />
            <AiOutlineSearch className="absolute left-3 top-3.5 text-textColor text-lg" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100 font-bold">
                <tr>
                  <th scope="col" className="px-6 py-4">Full Name</th>
                  <th scope="col" className="px-6 py-4">Email</th>
                  <th scope="col" className="px-6 py-4">Phone Number</th>
                  <th scope="col" className="px-6 py-4">Gender</th>
                  <th scope="col" className="px-6 py-4">Date of Birth</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patientsLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-textColor text-xs italic">
                      Loading registered patients...
                    </td>
                  </tr>
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.photo ? (
                            <img src={item.photo} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-bold border border-gray-200">
                              {item.name ? item.name.substring(0, 2).toUpperCase() : "PT"}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-headingColor">{item.name || "Unknown Patient"}</div>
                            <div className="text-[10px] text-textColor font-mono">{item.patientId || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-textColor">{item.email || "N/A"}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-textColor">{item.phone || "N/A"}</td>
                      <td className="px-6 py-4 text-xs capitalize text-textColor">{item.gender || "N/A"}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-headingColor">{formatDob(item.dob)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openPatient(item, "profile")}
                            className="bg-gray-100 hover:bg-gray-200 text-headingColor font-bold text-[11px] py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => openPatient(item, "treat")}
                            className="bg-primaryColor hover:bg-blue-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                          >
                            Treat
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-textColor text-xs italic">
                      No registered patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (selectedAction === "profile") {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-1.5 text-xs font-bold text-primaryColor hover:underline cursor-pointer"
        >
          <AiOutlineArrowLeft /> Back to Clinical History Directory
        </button>

        {profileLoading ? (
          <div className="text-center py-12 text-xs text-textColor italic">Loading patient profile...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <PatientDetailsCard patient={patient} />
              <MedicalSummaryCard patient={patient} />
              <ReportsCard reports={reports} getFileName={getFileName} />
            </div>

            <div className="lg:col-span-7 bg-white border border-solid border-gray-100 rounded-2xl p-6 shadow-sm">
              <h4 className="text-[16px] font-bold text-headingColor border-b border-solid border-gray-100 pb-3 mb-5 flex items-center gap-2 uppercase tracking-wide">
                <AiOutlineCalendar className="text-primaryColor" />
                Clinical History
              </h4>
              <ClinicalTimeline appointments={appointments} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (selectedAction === "treat") {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-1.5 text-xs font-bold text-primaryColor hover:underline cursor-pointer"
        >
          <AiOutlineArrowLeft /> Back to Clinical History Directory
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <PatientMiniCard patient={patient} />
            <MedicalSummaryCard patient={patient} compact />
            <PreviousRecordsCard appointments={appointments} />
          </div>

          <div className="lg:col-span-8 bg-white border border-solid border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-solid border-gray-150 pb-3.5 mb-5 gap-2">
              <h4 className="text-[16px] font-bold text-headingColor flex items-center gap-1.5 uppercase tracking-wide">
                <AiOutlineCheckCircle className="text-primaryColor" />
                Treatment Charting Workspace
              </h4>
              <div className="text-xs text-textColor">
                {currentBooking?.appointmentId ? `Current appointment: ${currentBooking.appointmentId}` : "Patient-based chart"}
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <TreatmentTextarea
                label="Symptoms / Notes"
                value={form.symptoms}
                onChange={(value) => handleFormChange("symptoms", value)}
                placeholder="Patient symptoms and history of present illness..."
                rows={2}
              />
              <TreatmentTextarea
                label="Diagnosis"
                value={form.diagnosis}
                onChange={(value) => handleFormChange("diagnosis", value)}
                placeholder="Clinical impression or diagnosis..."
                rows={2}
              />
              <TreatmentTextarea
                label="Prescription"
                value={form.prescription}
                onChange={(value) => handleFormChange("prescription", value)}
                placeholder="Medicines, dosage, and instructions..."
                rows={3}
                mono
              />
              <TreatmentTextarea
                label="Clinical Notes"
                value={form.clinicalNotes}
                onChange={(value) => handleFormChange("clinicalNotes", value)}
                placeholder="Examination findings and doctor notes..."
                rows={3}
              />
              <TreatmentTextarea
                label="Treatment Records"
                value={form.treatmentPlan}
                onChange={(value) => handleFormChange("treatmentPlan", value)}
                placeholder="Treatment plan, procedures, advice, or next steps..."
                rows={3}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-textColor block mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={form.followUpDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => handleFormChange("followUpDate", e.target.value)}
                    className="w-full text-xs p-3 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-headingColor bg-gray-50/30"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveTreatment(false)}
                    className="w-full py-3 px-4 bg-primaryColor hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm disabled:bg-blue-300 cursor-pointer min-h-[44px]"
                  >
                    {saving ? "Saving..." : "Save Chart"}
                  </button>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveTreatment(true)}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm disabled:bg-emerald-300 cursor-pointer min-h-[44px]"
                  >
                    {saving ? "Saving..." : "Complete Visit"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const PatientDetailsCard = ({ patient }) => (
  <div className="bg-white border border-solid border-gray-100 rounded-2xl p-6 shadow-sm">
    <div className="flex items-center gap-4 border-b border-solid border-gray-100 pb-5 mb-5">
      {patient.photo ? (
        <img src={patient.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primaryColor" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-100 border border-solid border-gray-200 flex items-center justify-center font-bold text-textColor text-[20px]">
          {patient.name?.substring(0, 2).toUpperCase() || "PT"}
        </div>
      )}
      <div>
        <span className="bg-[#e0f2fe] text-primaryColor font-bold text-[10px] px-2 py-0.5 rounded tracking-wider block w-fit">
          PATIENT PROFILE
        </span>
        <h3 className="text-[18px] font-bold text-headingColor mt-1">{patient.name || "Unknown Patient"}</h3>
        <p className="text-xs text-textColor">{patient.email || "N/A"}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 text-xs">
      <ProfileFact label="Patient ID" value={patient.patientId || "N/A"} mono />
      <ProfileFact label="Date of Birth" value={patient.dob ? dateFormat(patient.dob) : "N/A"} />
      <ProfileFact label="Gender" value={patient.gender || "N/A"} capitalize />
      <ProfileFact label="Contact" value={patient.phone || "N/A"} />
      <ProfileFact label="Blood Group" value={patient.bloodType || "N/A"} accent="text-red-600" />
      <ProfileFact label="Address" value={patient.address || "N/A"} />
    </div>
  </div>
);

const ProfileFact = ({ label, value, mono, capitalize, accent = "text-headingColor" }) => (
  <div className="bg-gray-50 p-2.5 rounded-lg border border-solid border-gray-100">
    <span className="text-[9px] uppercase font-bold text-textColor block">{label}</span>
    <span className={`font-bold ${accent} text-xs mt-0.5 block ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}>
      {value}
    </span>
  </div>
);

const PatientMiniCard = ({ patient }) => (
  <div className="bg-white border border-solid border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
    <h4 className="text-xs font-bold uppercase tracking-wider text-headingColor border-b border-gray-150 pb-2">
      Patient Info Card
    </h4>
    <div className="space-y-2.5 text-xs">
      <InfoRow label="Full Name" value={patient.name || "N/A"} />
      <InfoRow label="Email" value={patient.email || "N/A"} />
      <InfoRow label="Phone" value={patient.phone || "N/A"} />
      <InfoRow label="Gender" value={patient.gender || "N/A"} capitalize />
      <InfoRow label="Date of Birth" value={patient.dob ? dateFormat(patient.dob) : "N/A"} />
      <InfoRow label="Blood Group" value={patient.bloodType || "N/A"} />
    </div>
  </div>
);

const InfoRow = ({ label, value, capitalize }) => (
  <div className="flex justify-between gap-4">
    <span className="text-textColor">{label}:</span>
    <span className={`font-bold text-headingColor text-right ${capitalize ? "capitalize" : ""}`}>{value}</span>
  </div>
);

const MedicalSummaryCard = ({ patient, compact }) => (
  <div className={`bg-white border border-solid border-gray-100 rounded-2xl ${compact ? "p-5" : "p-6"} shadow-sm space-y-4`}>
    <h4 className="text-[14px] font-bold text-headingColor border-b border-solid border-gray-100 pb-2 uppercase tracking-wide">
      Medical Summary
    </h4>
    <MedicalSummaryItem label="Allergies" value={patient.allergies || "No known allergies."} />
    <MedicalSummaryItem label="Chronic Diseases" value={patient.chronicDiseases || "No chronic conditions listed."} />
    <MedicalSummaryItem label="Previous Surgeries" value={patient.previousSurgeries || "No surgical history listed."} />
    <MedicalSummaryItem label="Current Medications" value={patient.currentMedications || "No current medications listed."} />
  </div>
);

const MedicalSummaryItem = ({ label, value }) => (
  <div>
    <span className="text-[10px] font-bold text-textColor block uppercase">{label}</span>
    <div className="text-xs text-headingColor bg-gray-50 border border-solid border-gray-100 p-2.5 rounded-lg mt-1 min-h-[40px] italic">
      {value}
    </div>
  </div>
);

const ReportsCard = ({ reports, getFileName }) => (
  <div className="bg-white border border-solid border-gray-100 rounded-2xl p-6 shadow-sm">
    <h4 className="text-[14px] font-bold text-headingColor border-b border-solid border-gray-100 pb-2 mb-3 uppercase tracking-wide">
      Uploaded Reports ({reports.length})
    </h4>
    {reports.length > 0 ? (
      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
        {reports.map((reportUrl, idx) => (
          <a
            key={idx}
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 bg-gray-50 border border-solid border-gray-100 rounded-lg hover:bg-gray-100 transition-all text-xs text-primaryColor font-medium truncate"
          >
            <div className="flex items-center gap-2 truncate">
              <AiOutlineFile className="text-[16px] text-gray-500 shrink-0" />
              <span className="truncate">{getFileName(reportUrl)}</span>
            </div>
            <span className="text-[9px] text-textColor shrink-0 hover:underline">View File</span>
          </a>
        ))}
      </div>
    ) : (
      <p className="text-xs text-textColor italic text-center py-4">No uploaded medical documents.</p>
    )}
  </div>
);

const ClinicalTimeline = ({ appointments }) => {
  if (appointments.length === 0) {
    return <p className="text-xs text-textColor italic text-center py-6">No appointments or treatment records found.</p>;
  }

  return (
    <div className="relative border-l border-solid border-gray-200 ml-4 space-y-6">
      {appointments.map((item) => (
        <div key={item._id} className="relative pl-6">
          <span className="absolute -left-[6px] top-1 bg-primaryColor border-2 border-solid border-white w-3 h-3 rounded-full"></span>
          <div className="bg-gray-50 border border-solid border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-solid border-gray-200/50 pb-2 gap-1">
              <span className="text-[11px] font-bold text-headingColor flex items-center gap-1">
                <AiOutlineCalendar className="text-[14px] text-gray-500" />
                {dateFormat(item.appointmentDate || item.createdAt)}
              </span>
              <span className="text-[10px] bg-indigo-100 text-primaryColor font-bold px-2 py-0.5 rounded-full">
                {item.status || "N/A"} - {item.doctor?.name || "Doctor"}
              </span>
            </div>
            <AppointmentMeta item={item} />
            <ClinicalField label="Diagnosis" value={item.diagnosis || "No diagnosis logged."} />
            <ClinicalField label="Prescription" value={item.prescription} mono />
            <ClinicalField label="Clinical Notes" value={item.clinicalNotes || item.consultationNotes} />
            <ClinicalField label="Treatment Records" value={item.treatmentPlan} />
            <ClinicalField label="Symptoms" value={item.symptoms} />
          </div>
        </div>
      ))}
    </div>
  );
};

const AppointmentMeta = ({ item }) => (
  <div className="text-[10px] text-textColor flex flex-wrap gap-2">
    <span className="bg-white border border-gray-100 rounded px-2 py-1 font-mono">{item.appointmentId || "No appointment ID"}</span>
    {item.appointmentTime?.startingTime && (
      <span className="bg-white border border-gray-100 rounded px-2 py-1">
        {convertTime(item.appointmentTime.startingTime)} - {convertTime(item.appointmentTime.endingTime)}
      </span>
    )}
    {item.followUpDate && <span className="bg-white border border-gray-100 rounded px-2 py-1">Follow-up: {dateFormat(item.followUpDate)}</span>}
  </div>
);

const ClinicalField = ({ label, value, mono }) => {
  if (!value) return null;
  return (
    <div className="text-xs">
      <strong className="text-gray-700 block text-[10px] uppercase font-bold tracking-wide">{label}:</strong>
      <p className={`text-headingColor bg-white p-2 rounded border border-solid border-gray-200 mt-0.5 ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
};

const PreviousRecordsCard = ({ appointments }) => {
  const clinicalRecords = appointments.filter(
    (item) => item.diagnosis || item.prescription || item.treatmentPlan || item.clinicalNotes || item.consultationNotes
  );

  return (
    <div className="bg-white border border-solid border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-headingColor border-b border-gray-150 pb-2">
        Previous Treatment Records ({clinicalRecords.length})
      </h4>
      <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1">
        {clinicalRecords.map((item) => (
          <div key={item._id} className="bg-gray-50 border border-solid border-gray-100 rounded-lg p-2.5 text-xs">
            <span className="font-bold text-headingColor block text-[10px]">{dateFormat(item.appointmentDate || item.createdAt)}</span>
            <span className="text-[10px] font-medium text-textColor block mt-0.5">Diagnosis: {item.diagnosis || "No details"}</span>
            {item.prescription && <span className="text-[10px] font-mono text-primaryColor block truncate mt-0.5">Prescription: {item.prescription}</span>}
          </div>
        ))}
        {clinicalRecords.length === 0 && (
          <p className="text-xs text-textColor italic text-center py-4">No previous treatment records.</p>
        )}
      </div>
    </div>
  );
};

const TreatmentTextarea = ({ label, value, onChange, placeholder, rows, mono }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-textColor block mb-1">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full text-xs p-3 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-headingColor bg-gray-50/30 ${mono ? "font-mono leading-normal" : ""}`}
    />
  </div>
);

export default PatientEMR;
