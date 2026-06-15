/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import useFetchData from "../../hooks/useFetchData";
import Loading from "../../components/Loader/Loading";
import Error from "../../components/Error/Error";
import { BASE_URL } from "../../config";
import convertTime from "../../../utils/convertTime";
import { dateFormat } from "../../../utils/dateFormat";
import {
  AiOutlineCalendar,
  AiOutlineCheckCircle,
  AiOutlineClose,
  AiOutlineFile,
  AiOutlineProfile,
} from "react-icons/ai";
import { toast } from "react-toastify";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "upcoming", label: "Upcoming Appointments" },
  { id: "past", label: "Past Appointments" },
  { id: "completed", label: "Completed Appointments" },
];

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [reschedulingBooking, setReschedulingBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useFetchData(`${BASE_URL}/users/dashboard/overview`);

  const appointmentUrl =
    activeTab === "overview" ? null : `${BASE_URL}/users/appointments/filter/${activeTab}`;

  const {
    data: appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useFetchData(appointmentUrl);

  const getDayName = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[date.getDay()];
  };

  const selectedDayName = getDayName(rescheduleDate);
  const availableSlotsForDay = useMemo(() => {
    return (
      reschedulingBooking?.doctor?.timeSlots?.filter(
        (slot) => slot.day.toLowerCase() === selectedDayName && slot.enabled !== false
      ) || []
    );
  }, [reschedulingBooking, selectedDayName]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      toast.success("Appointment cancelled successfully!");
      refetchAppointments();
      refetchOverview();
    } catch (err) {
      toast.error(err.message || "Failed to cancel appointment");
    }
  };

  const handleRescheduleClick = (booking) => {
    setReschedulingBooking(booking);
    setRescheduleDate("");
    setRescheduleSlot(null);
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleSlot) {
      toast.error("Please select a date and an available time slot");
      return;
    }

    setSaveLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/bookings/${reschedulingBooking._id}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentDate: rescheduleDate,
          appointmentTime: rescheduleSlot,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      toast.success("Appointment rescheduled successfully!");
      setReschedulingBooking(null);
      refetchAppointments();
      refetchOverview();
    } catch (err) {
      toast.error(err.message || "Failed to reschedule appointment");
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrintReceipt = (booking) => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${booking.appointmentId || "Appointment"}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #334155; padding: 32px; }
            .receipt { max-width: 720px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px; }
            h1 { color: #0066ff; font-size: 22px; margin-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
            td:first-child { color: #64748b; font-weight: 700; width: 38%; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>Life HealthCare Consultation Receipt</h1>
            <p>Appointment ID: <strong>${booking.appointmentId || "N/A"}</strong></p>
            <table>
              <tr><td>Doctor</td><td>${booking.doctor?.name || "N/A"}</td></tr>
              <tr><td>Specialization</td><td>${booking.doctor?.specialization || "N/A"}</td></tr>
              <tr><td>Date</td><td>${booking.appointmentDate ? dateFormat(booking.appointmentDate) : "N/A"}</td></tr>
              <tr><td>Time Slot</td><td>${formatSlot(booking)}</td></tr>
              <tr><td>Status</td><td>${booking.status || "N/A"}</td></tr>
              <tr><td>Payment ID</td><td>${booking.paymentId || "N/A"}</td></tr>
              <tr><td>Ticket Price</td><td>${booking.ticketPrice === "0" ? "Free of Charge" : `${booking.ticketPrice || "0"} LKR`}</td></tr>
            </table>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const isLoading = activeTab === "overview" ? overviewLoading : appointmentsLoading;
  const error = activeTab === "overview" ? overviewError : appointmentsError;

  return (
    <div className="mt-5 font-sans space-y-6">
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-gray-100/80 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-[11px] sm:text-xs font-bold rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-white text-primaryColor shadow-sm"
                  : "bg-transparent text-textColor hover:text-headingColor"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !error && <Loading />}
      {error && !isLoading && <Error errorMsg={error} />}

      {!isLoading && !error && activeTab === "overview" && (
        <OverviewSection overview={overview} onViewReceipt={setSelectedReceipt} onViewRecord={setSelectedRecord} />
      )}

      {!isLoading && !error && activeTab !== "overview" && (
        <AppointmentsSection
          activeTab={activeTab}
          appointments={Array.isArray(appointments) ? appointments : []}
          onViewReceipt={setSelectedReceipt}
          onViewRecord={setSelectedRecord}
          onReschedule={handleRescheduleClick}
          onCancel={handleCancelBooking}
        />
      )}

      {selectedReceipt && (
        <ReceiptModal
          booking={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onPrint={() => handlePrintReceipt(selectedReceipt)}
        />
      )}

      {selectedRecord && <MedicalRecordModal booking={selectedRecord} onClose={() => setSelectedRecord(null)} />}

      {reschedulingBooking && (
        <RescheduleModal
          booking={reschedulingBooking}
          selectedDayName={selectedDayName}
          rescheduleDate={rescheduleDate}
          setRescheduleDate={setRescheduleDate}
          rescheduleSlot={rescheduleSlot}
          setRescheduleSlot={setRescheduleSlot}
          availableSlotsForDay={availableSlotsForDay}
          saveLoading={saveLoading}
          onClose={() => setReschedulingBooking(null)}
          onSubmit={handleConfirmReschedule}
        />
      )}
    </div>
  );
};

const OverviewSection = ({ overview, onViewReceipt, onViewRecord }) => {
  const patient = overview?.patient || {};
  const latestAppointment = overview?.latestAppointment;
  const latestPrescription = overview?.latestPrescription;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total Appointments" value={overview?.totalAppointments || 0} icon={<AiOutlineCalendar />} />
        <SummaryCard label="Blood Group" value={patient.bloodType || "N/A"} icon={<AiOutlineProfile />} />
        <SummaryCard label="Patient ID" value={patient.patientId || "N/A"} icon={<AiOutlineCheckCircle />} mono />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-headingColor uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">
            Patient Information
          </h4>
          <InfoGrid
            items={[
              ["Full Name", patient.name || "N/A"],
              ["Email", patient.email || "N/A"],
              ["Patient ID", patient.patientId || "N/A"],
              ["Blood Group", patient.bloodType || "N/A"],
              ["Contact Details", patient.phone || "N/A"],
              ["Active Conditions", overview?.activeMedicalConditions || "No active conditions listed"],
            ]}
          />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-headingColor uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">
            Latest Appointment
          </h4>
          {latestAppointment ? (
            <div className="space-y-3">
              <DoctorHeader booking={latestAppointment} />
              <AppointmentDetails booking={latestAppointment} />
              <button
                onClick={() => onViewReceipt(latestAppointment)}
                className="w-full py-2 px-3 border border-gray-200 hover:bg-gray-50 text-textColor font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <AiOutlineFile /> View Receipt
              </button>
            </div>
          ) : (
            <EmptyState title="No appointments yet" text="Your latest appointment will appear here after booking." />
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h4 className="text-sm font-bold text-headingColor uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">
          Latest Doctor Prescription
        </h4>
        {latestPrescription ? (
          <div className="space-y-3">
            <DoctorHeader booking={latestPrescription} />
            <ClinicalBox label="Prescription" value={latestPrescription.prescription} mono />
            <button
              onClick={() => onViewRecord(latestPrescription)}
              className="py-2 px-4 bg-primaryColor hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors"
            >
              View Medical Record
            </button>
          </div>
        ) : (
          <EmptyState title="No prescriptions available" text="Prescriptions added by your doctor will appear here securely." />
        )}
      </div>
    </div>
  );
};

const AppointmentsSection = ({ activeTab, appointments, onViewReceipt, onViewRecord, onReschedule, onCancel }) => {
  if (appointments.length === 0) {
    return (
      <EmptyState
        title="No appointments found"
        text={`There are no ${activeTab} appointments to show right now.`}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {appointments.map((booking) => (
        <AppointmentCard
          key={booking._id}
          booking={booking}
          activeTab={activeTab}
          onViewReceipt={onViewReceipt}
          onViewRecord={onViewRecord}
          onReschedule={onReschedule}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
};

const AppointmentCard = ({ booking, activeTab, onViewReceipt, onViewRecord, onReschedule, onCancel }) => (
  <div className="bg-white border border-solid border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono font-bold text-xs text-primaryColor bg-[#0066ff0d] px-3 py-1 rounded-md">
          {booking.appointmentId || "N/A"}
        </span>
        <StatusBadge status={booking.status} />
      </div>

      <DoctorHeader booking={booking} />
      <AppointmentDetails booking={booking} />

      {activeTab === "completed" && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
          <ClinicalBox label="Diagnosis Summary" value={booking.diagnosis || "No diagnosis summary available."} />
          {booking.prescription && <ClinicalBox label="Prescription" value={booking.prescription} mono />}
        </div>
      )}
    </div>

    <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-solid border-gray-100">
      {activeTab === "upcoming" && (
        <>
          <button
            onClick={() => onReschedule(booking)}
            className="flex-1 py-2 px-3 border border-solid border-primaryColor hover:bg-primaryColor hover:text-white text-primaryColor font-semibold text-xs rounded-lg transition-all"
          >
            Reschedule
          </button>
          <button
            onClick={() => onCancel(booking._id)}
            className="flex-1 py-2 px-3 border border-solid border-red-500 hover:bg-red-500 hover:text-white text-red-500 font-semibold text-xs rounded-lg transition-all"
          >
            Cancel
          </button>
        </>
      )}

      {activeTab === "past" && (
        <button
          onClick={() => onViewReceipt(booking)}
          className="flex-1 py-2 px-3 border border-solid border-gray-200 hover:bg-gray-50 text-textColor font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <AiOutlineFile /> View Receipt
        </button>
      )}

      {activeTab === "completed" && (
        <>
          <button
            onClick={() => onViewRecord(booking)}
            className="flex-1 py-2 px-3 bg-primaryColor hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            View Medical Record
          </button>
          <button
            onClick={() => onViewReceipt(booking)}
            className="flex-1 py-2 px-3 border border-solid border-gray-200 hover:bg-gray-50 text-textColor font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <AiOutlineFile /> Receipt
          </button>
        </>
      )}
    </div>
  </div>
);

const SummaryCard = ({ label, value, icon, mono }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-primaryColor/10 text-primaryColor rounded-xl text-[24px] shrink-0">{icon}</div>
    <div className="min-w-0">
      <span className="text-[10px] uppercase font-bold text-textColor tracking-wider block">{label}</span>
      <span className={`text-[20px] font-black text-headingColor block truncate ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  </div>
);

const InfoGrid = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {items.map(([label, value]) => (
      <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
        <span className="text-[10px] uppercase font-bold text-textColor block">{label}</span>
        <span className="text-xs font-bold text-headingColor mt-1 block break-words">{value}</span>
      </div>
    ))}
  </div>
);

const DoctorHeader = ({ booking }) => (
  <div className="flex items-start gap-3.5">
    {booking.doctor?.photo ? (
      <figure className="w-12 h-12 rounded-full overflow-hidden shrink-0">
        <img src={booking.doctor.photo} alt="" className="w-full h-full object-cover" />
      </figure>
    ) : (
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
        Dr.
      </div>
    )}
    <div>
      <h4 className="text-[16px] leading-6 font-bold text-headingColor">{booking.doctor?.name || "Dr. Unknown"}</h4>
      {booking.doctor?.specialization && (
        <span className="inline-block text-xs text-irisBlueColor bg-[#CCF0F3] px-2 py-0.5 rounded font-medium capitalize">
          {booking.doctor.specialization}
        </span>
      )}
    </div>
  </div>
);

const AppointmentDetails = ({ booking }) => (
  <div className="space-y-2 text-sm border-t border-solid border-gray-50 pt-3">
    <DetailRow label="Date" value={booking.appointmentDate ? dateFormat(booking.appointmentDate) : "N/A"} />
    <DetailRow label="Time Slot" value={formatSlot(booking)} />
    <div className="grid grid-cols-2 gap-2 pt-1">
      <MiniMetric label="Queue" value={`#${booking.bookingNumber || "1"}`} />
      <MiniMetric label="Consult Time" value={booking.consultationTime || "Pending"} />
    </div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-textColor">{label}:</span>
    <span className="font-semibold text-headingColor text-right">{value}</span>
  </div>
);

const MiniMetric = ({ label, value }) => (
  <div className="bg-gray-50 border border-solid border-gray-100 p-2 rounded text-center">
    <p className="text-[10px] text-textColor font-bold uppercase tracking-wider">{label}</p>
    <p className="font-bold text-sm text-headingColor mt-0.5">{value}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  let statusColor = "bg-yellow-100 text-yellow-800";
  if (status === "Confirmed") statusColor = "bg-green-100 text-green-800";
  if (status === "Completed") statusColor = "bg-blue-100 text-blue-800";
  if (status === "Cancelled" || status === "cancelled") statusColor = "bg-red-100 text-red-800";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${statusColor}`}>
      {status || "Pending"}
    </span>
  );
};

const ClinicalBox = ({ label, value, mono }) => (
  <div>
    <span className="text-[10px] uppercase font-bold text-textColor block">{label}</span>
    <p className={`text-xs text-headingColor bg-white border border-gray-100 rounded-lg p-2 mt-1 whitespace-pre-wrap ${mono ? "font-mono" : ""}`}>
      {value || "Not available"}
    </p>
  </div>
);

const EmptyState = ({ title, text }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
    <h2 className="text-[18px] font-bold text-primaryColor">{title}</h2>
    <p className="text-textColor text-sm mt-2">{text}</p>
  </div>
);

const ReceiptModal = ({ booking, onClose, onPrint }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-solid border-gray-100 relative max-h-[90vh] flex flex-col">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-1.5 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors"
        title="Close Receipt"
      >
        <AiOutlineClose className="text-lg" />
      </button>

      <div className="bg-primaryColor px-6 py-6 text-center text-white shrink-0">
        <h2 className="text-[15px] font-bold tracking-wider uppercase mb-1">Life HealthCare Medical Center</h2>
        <h3 className="text-xl font-bold tracking-tight">Consultation Receipt</h3>
      </div>

      <div className="p-6 overflow-y-auto space-y-4 flex-1">
        <InfoGrid
          items={[
            ["Appointment ID", booking.appointmentId || "N/A"],
            ["Status", booking.status || "N/A"],
            ["Doctor", booking.doctor?.name || "N/A"],
            ["Specialization", booking.doctor?.specialization || "N/A"],
            ["Date", booking.appointmentDate ? dateFormat(booking.appointmentDate) : "N/A"],
            ["Time Slot", formatSlot(booking)],
            ["Payment ID", booking.paymentId || "N/A"],
            ["Ticket Price", booking.ticketPrice === "0" ? "Free of Charge" : `${booking.ticketPrice || "0"} LKR`],
          ]}
        />
      </div>

      <div className="p-5 bg-gray-50 border-t border-solid border-gray-100 shrink-0 flex items-center justify-end gap-3">
        <button onClick={onPrint} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg">
          Print Receipt
        </button>
        <button onClick={onClose} className="px-5 py-2 bg-primaryColor hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
          Close
        </button>
      </div>
    </div>
  </div>
);

const MedicalRecordModal = ({ booking, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-solid border-gray-100 relative max-h-[90vh] flex flex-col">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-1.5 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors"
        title="Close Medical Record"
      >
        <AiOutlineClose className="text-lg" />
      </button>
      <div className="bg-primaryColor px-6 py-6 text-white shrink-0">
        <h3 className="text-xl font-bold tracking-tight">Medical Record</h3>
        <p className="text-blue-100 text-xs mt-1">
          {booking.doctor?.name || "Doctor"} - {booking.appointmentDate ? dateFormat(booking.appointmentDate) : "N/A"}
        </p>
      </div>
      <div className="p-6 overflow-y-auto space-y-4 flex-1">
        <ClinicalBox label="Diagnosis" value={booking.diagnosis || "No diagnosis summary available."} />
        <ClinicalBox label="Prescription" value={booking.prescription || "No prescription available."} mono />
        <ClinicalBox label="Clinical Notes" value={booking.clinicalNotes || booking.consultationNotes || "No clinical notes available."} />
        <ClinicalBox label="Treatment Records" value={booking.treatmentPlan || "No treatment record available."} />
      </div>
      <div className="p-5 bg-gray-50 border-t border-solid border-gray-100 shrink-0 flex justify-end">
        <button onClick={onClose} className="px-5 py-2 bg-primaryColor hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
          Close
        </button>
      </div>
    </div>
  </div>
);

const RescheduleModal = ({
  booking,
  selectedDayName,
  rescheduleDate,
  setRescheduleDate,
  rescheduleSlot,
  setRescheduleSlot,
  availableSlotsForDay,
  saveLoading,
  onClose,
  onSubmit,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-solid border-gray-100 flex flex-col">
      <div className="bg-primaryColor px-6 py-5 text-white flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Reschedule Appointment</h3>
          <p className="text-blue-100 text-xs mt-0.5">Choose a new date and available slot</p>
        </div>
        <button onClick={onClose} className="p-1 text-white hover:bg-white/10 rounded-full transition-colors">
          <AiOutlineClose className="text-lg" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-textColor uppercase tracking-wider mb-1">
            Select New Date
          </label>
          <input
            type="date"
            value={rescheduleDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => {
              setRescheduleDate(e.target.value);
              setRescheduleSlot(null);
            }}
            className="w-full px-3 py-2 border border-solid border-gray-200 rounded-xl focus:outline-none focus:border-primaryColor text-sm font-semibold"
            required
          />
        </div>

        {rescheduleDate && (
          <div>
            <label className="block text-[11px] font-bold text-textColor uppercase tracking-wider mb-2">
              Available Time Slots for {rescheduleDate} ({selectedDayName})
            </label>
            {booking?.doctor?.scheduleStatus !== "Approved" ? (
              <p className="text-xs text-red-500 italic">This doctor&apos;s schedule is not approved currently.</p>
            ) : availableSlotsForDay.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {availableSlotsForDay.map((slot, idx) => (
                  <button
                    type="button"
                    key={`${slot.day}-${slot.startingTime}-${idx}`}
                    onClick={() => setRescheduleSlot(slot)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border border-solid text-xs transition-all ${
                      rescheduleSlot === slot
                        ? "bg-primaryColor text-white border-primaryColor shadow-sm"
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-bold capitalize">{slot.day}</span>
                    <span className="font-semibold">{convertTime(slot.startingTime)} - {convertTime(slot.endingTime)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-textColor/75 italic bg-gray-50 border border-solid border-gray-100 rounded-xl p-3 text-center">
                No active sessions scheduled by the doctor on this day. Please select another date.
              </p>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-solid border-gray-100 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-solid border-gray-300 text-textColor hover:bg-gray-100 text-xs font-semibold rounded-lg"
            disabled={saveLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-primaryColor hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:bg-blue-300"
            disabled={saveLoading || !rescheduleSlot}
          >
            {saveLoading ? "Saving..." : "Confirm Reschedule"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const formatSlot = (booking) => {
  if (!booking.appointmentTime?.startingTime || !booking.appointmentTime?.endingTime) return "N/A";
  return `${convertTime(booking.appointmentTime.startingTime)} - ${convertTime(booking.appointmentTime.endingTime)}`;
};

export default MyBookings;
