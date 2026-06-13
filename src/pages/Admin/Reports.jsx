import { useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import HashLoader from 'react-spinners/HashLoader';
import { dateFormat } from '../../../utils/dateFormat';

const Reports = () => {
    const { data: bookings, loading: bookingsLoading, error: bookingsError } = useFetchData(`${BASE_URL}/admin/bookings`);
    const { data: doctors, loading: doctorsLoading, error: doctorsError } = useFetchData(`${BASE_URL}/admin/doctors`);
    const { data: patients, loading: patientsLoading, error: patientsError } = useFetchData(`${BASE_URL}/admin/patients`);

    const loading = bookingsLoading || doctorsLoading || patientsLoading;
    const error = bookingsError || doctorsError || patientsError;

    const [reportType, setReportType] = useState('appointments'); // 'appointments', 'payments', 'demographics', 'performance', 'sessions'
    const [timeFilter, setTimeFilter] = useState('monthly'); // 'daily', 'weekly', 'monthly'

    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    const extractCreationDate = (doc) => {
        if (!doc) return new Date();
        if (doc.createdAt) return new Date(doc.createdAt);
        const idStr = doc._id ? doc._id.toString() : '';
        if (idStr.length === 24) {
            return new Date(parseInt(idStr.substring(0, 8), 16) * 1000);
        }
        return new Date();
    };

    const getFilteredBookings = () => {
        if (!bookings) return [];
        return bookings.filter(booking => {
            if (!booking.user || !booking.user.name || booking.user.name === 'Unknown') return false;
            
            const apptDateObj = booking.appointmentDate ? new Date(booking.appointmentDate) : extractCreationDate(booking);
            if (isNaN(apptDateObj.getTime())) return false;

            if (timeFilter === 'daily') {
                const filterDate = new Date(selectedDate);
                return apptDateObj.getDate() === filterDate.getDate() &&
                       apptDateObj.getMonth() === filterDate.getMonth() &&
                       apptDateObj.getFullYear() === filterDate.getFullYear();
            }

            if (timeFilter === 'weekly') {
                const filterDate = new Date(selectedDate);
                const dayOfWeek = filterDate.getDay();
                
                const startOfWeek = new Date(filterDate);
                startOfWeek.setDate(filterDate.getDate() - dayOfWeek);
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);

                return apptDateObj >= startOfWeek && apptDateObj <= endOfWeek;
            }

            if (timeFilter === 'monthly') {
                return apptDateObj.getMonth() === parseInt(selectedMonth) &&
                       apptDateObj.getFullYear() === parseInt(selectedYear);
            }

            return true;
        });
    };

    const getFilteredPatients = () => {
        if (!patients) return [];
        return patients.filter(patient => {
            const dateObj = extractCreationDate(patient);
            if (isNaN(dateObj.getTime())) return false;

            if (timeFilter === 'daily') {
                const filterDate = new Date(selectedDate);
                return dateObj.getDate() === filterDate.getDate() &&
                       dateObj.getMonth() === filterDate.getMonth() &&
                       dateObj.getFullYear() === filterDate.getFullYear();
            }

            if (timeFilter === 'weekly') {
                const filterDate = new Date(selectedDate);
                const dayOfWeek = filterDate.getDay();
                
                const startOfWeek = new Date(filterDate);
                startOfWeek.setDate(filterDate.getDate() - dayOfWeek);
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);

                return dateObj >= startOfWeek && dateObj <= endOfWeek;
            }

            if (timeFilter === 'monthly') {
                return dateObj.getMonth() === parseInt(selectedMonth) &&
                       dateObj.getFullYear() === parseInt(selectedYear);
            }

            return true;
        });
    };

    const handlePrintReport = (type, timeRange, date, month, year, reportData) => {
        let iframe = document.getElementById("report-print-iframe");
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.id = "report-print-iframe";
            iframe.style.position = "absolute";
            iframe.style.width = "0px";
            iframe.style.height = "0px";
            iframe.style.border = "none";
            document.body.appendChild(iframe);
        }
        
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        
        let periodTitle = "";
        if (timeRange === 'daily') {
            periodTitle = `Daily Report - ${date}`;
        } else if (timeRange === 'weekly') {
            const filterDate = new Date(date);
            const dayOfWeek = filterDate.getDay();
            const startOfWeek = new Date(filterDate);
            startOfWeek.setDate(filterDate.getDate() - dayOfWeek);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            periodTitle = `Weekly Report - Week of ${startOfWeek.toLocaleDateString()} to ${endOfWeek.toLocaleDateString()}`;
        } else {
            periodTitle = `Monthly Report - ${monthNames[month]} ${year}`;
        }
        
        let reportName = "";
        let tableHeaders = "";
        let tableRows = "";
        let tableFooter = "";
        
        if (type === 'appointments') {
            reportName = "Doctor Appointment Summary Report";
            tableHeaders = `
                <tr>
                    <th>Appt ID</th>
                    <th>Patient Name</th>
                    <th>Doctor Name</th>
                    <th>Date & Time Slot</th>
                    <th>Status</th>
                </tr>
            `;
            tableRows = reportData.map((booking) => `
                <tr>
                    <td>${booking.appointmentId || 'APT-Pending'}</td>
                    <td>${booking.user?.name || 'Unknown'}</td>
                    <td>${booking.doctor?.name || 'Unknown'}</td>
                    <td>${booking.appointmentDate ? new Date(booking.appointmentDate).toLocaleDateString() : 'N/A'} (${booking.appointmentTime?.day || 'N/A'}: ${booking.appointmentTime?.startingTime || ''} - ${booking.appointmentTime?.endingTime || ''})</td>
                    <td><span style="font-weight:bold; color: ${booking.status === 'Completed' || booking.status === 'Confirmed' || booking.status === 'Approved' ? '#16a34a' : '#d97706'}">${booking.status || 'Pending'}</span></td>
                </tr>
            `).join('');
        } else if (type === 'payments') {
            reportName = "Payment & Revenue Summary Report";
            tableHeaders = `
                <tr>
                    <th>Payment ID</th>
                    <th>Appt ID</th>
                    <th>Patient Name</th>
                    <th>Payment Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                </tr>
            `;
            tableRows = reportData.map((booking) => `
                <tr>
                    <td>${booking.paymentId || 'PAY-Pending'}</td>
                    <td>${booking.appointmentId || 'APT-Pending'}</td>
                    <td>${booking.user?.name || 'Unknown'}</td>
                    <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
                    <td>${booking.isPaid ? 'Finished' : 'Pending'}</td>
                    <td>${booking.ticketPrice || 0} LKR</td>
                </tr>
            `).join('');
            
            const totalSum = reportData.reduce((sum, b) => sum + (b.isPaid ? Number(b.ticketPrice || 0) : 0), 0);
            tableFooter = `
                <tr style="background-color: #f1f5f9; font-weight: bold;">
                    <td colspan="5" style="text-align: right; padding: 12px;">Total Paid Revenue:</td>
                    <td style="padding: 12px;">${totalSum} LKR</td>
                </tr>
            `;
        } else if (type === 'demographics') {
            reportName = "Patient Demographics & Medical Summary Report";
            tableHeaders = `
                <tr>
                    <th>Patient ID</th>
                    <th>Patient Name & Email</th>
                    <th>Age / Gender</th>
                    <th>Blood Group</th>
                    <th>Contact Phone</th>
                    <th>Allergies & Chronic Diseases</th>
                    <th>Medications & Surgeries</th>
                </tr>
            `;
            tableRows = reportData.map((patient) => `
                <tr>
                    <td><strong>${patient.patientId || 'N/A'}</strong></td>
                    <td><strong>${patient.name || 'Unknown'}</strong><br/><span style="font-size: 10px; color: #64748b;">${patient.email || ''}</span></td>
                    <td style="text-transform: capitalize;">${patient.age || 'N/A'} yrs / ${patient.gender || 'N/A'}</td>
                    <td style="font-weight: bold; color: #2563eb;">${patient.bloodType || 'N/A'}</td>
                    <td>${patient.phone || 'N/A'}</td>
                    <td>
                        <div style="margin-bottom: 4px;"><strong>Allergies:</strong> ${patient.allergies || 'None'}</div>
                        <div><strong>Chronic Diseases:</strong> ${patient.chronicDiseases || 'None'}</div>
                    </td>
                    <td>
                        <div style="margin-bottom: 4px;"><strong>Medications:</strong> ${patient.currentMedications || 'None'}</div>
                        <div><strong>Surgeries:</strong> ${patient.previousSurgeries || 'None'}</div>
                    </td>
                </tr>
            `).join('');
            
            tableFooter = `
                <tr style="background-color: #f1f5f9; font-weight: bold;">
                    <td colspan="6" style="text-align: right; padding: 12px;">Total Registered Patients in Period:</td>
                    <td style="padding: 12px;">${reportData.length}</td>
                </tr>
            `;
        } else if (type === 'performance') {
            reportName = "Doctor Performance & Workload Report";
            tableHeaders = `
                <tr>
                    <th>Doctor Name</th>
                    <th>Specialization</th>
                    <th>Ticket Price</th>
                    <th>Bookings Count</th>
                    <th>Completed Visits</th>
                    <th>Est. Revenue</th>
                </tr>
            `;
            
            const doctorPerformance = {};
            if (doctors && Array.isArray(doctors)) {
                doctors.forEach(doc => {
                    doctorPerformance[doc._id.toString()] = {
                        name: doc.name || 'Unknown',
                        specialization: doc.specialization || 'N/A',
                        ticketPrice: doc.ticketPrice || 0,
                        bookingsCount: 0,
                        completedCount: 0,
                        revenue: 0
                    };
                });
            }
            reportData.forEach(booking => {
                if (!booking.doctor) return;
                const docId = booking.doctor._id ? booking.doctor._id.toString() : booking.doctor.toString();
                if (!doctorPerformance[docId]) {
                    const docInfo = doctors && doctors.find(d => d._id.toString() === docId);
                    doctorPerformance[docId] = {
                        name: docInfo?.name || booking.doctor.name || 'Unknown',
                        specialization: docInfo?.specialization || 'N/A',
                        ticketPrice: docInfo?.ticketPrice || booking.ticketPrice || 0,
                        bookingsCount: 0,
                        completedCount: 0,
                        revenue: 0
                    };
                }
                doctorPerformance[docId].bookingsCount += 1;
                if (booking.status === 'Completed') {
                    doctorPerformance[docId].completedCount += 1;
                    doctorPerformance[docId].revenue += Number(booking.ticketPrice || 0);
                }
            });
            const perfList = Object.values(doctorPerformance);
            
            tableRows = perfList.map(doc => `
                <tr>
                    <td><strong>${doc.name}</strong></td>
                    <td style="text-transform: capitalize;">${doc.specialization}</td>
                    <td>${doc.ticketPrice} LKR</td>
                    <td>${doc.bookingsCount}</td>
                    <td>${doc.completedCount}</td>
                    <td>${doc.revenue} LKR</td>
                </tr>
            `).join('');
            
            const totalBookings = perfList.reduce((sum, d) => sum + d.bookingsCount, 0);
            const totalRevenue = perfList.reduce((sum, d) => sum + d.revenue, 0);
            tableFooter = `
                <tr style="background-color: #f1f5f9; font-weight: bold;">
                    <td colspan="3" style="text-align: right; padding: 12px;">Total:</td>
                    <td style="padding: 12px;">${totalBookings} Bookings</td>
                    <td style="padding: 12px;">${perfList.reduce((sum, d) => sum + d.completedCount, 0)} Completed</td>
                    <td style="padding: 12px;">${totalRevenue} LKR</td>
                </tr>
            `;
        } else if (type === 'sessions') {
            reportName = "Session Scheduling & Slot Utilisation Report";
            tableHeaders = `
                <tr>
                    <th>Time Slot</th>
                    <th>Doctor Name</th>
                    <th>Specialization</th>
                    <th>Patients Count</th>
                    <th>Peak Queue Position</th>
                    <th>Density Status</th>
                </tr>
            `;
            
            const sessionsList = [];
            const processedKeys = new Set();
            
            if (doctors && Array.isArray(doctors)) {
                doctors.forEach(doc => {
                    if (doc.timeSlots && Array.isArray(doc.timeSlots)) {
                        doc.timeSlots.forEach(slot => {
                            const slotKey = `${doc._id.toString()}_${slot.day?.toLowerCase()}_${slot.startingTime}`;
                            processedKeys.add(slotKey);
                            
                            const bookingsForSlot = reportData.filter(b => {
                                const bDocId = b.doctor ? (b.doctor._id ? b.doctor._id.toString() : b.doctor.toString()) : null;
                                return bDocId === doc._id.toString() &&
                                       b.appointmentTime?.day?.toLowerCase() === slot.day?.toLowerCase() &&
                                       b.appointmentTime?.startingTime === slot.startingTime;
                            });
                            
                            const maxQueue = bookingsForSlot.reduce((max, b) => b.bookingNumber > max ? b.bookingNumber : max, 0);
                            
                            sessionsList.push({
                                day: slot.day,
                                startingTime: slot.startingTime,
                                endingTime: slot.endingTime,
                                doctorName: doc.name || 'Unknown',
                                specialization: doc.specialization || 'N/A',
                                patientsCount: bookingsForSlot.length,
                                maxQueue: maxQueue
                            });
                        });
                    }
                });
            }
            
            reportData.forEach(booking => {
                if (!booking.appointmentTime || !booking.doctor) return;
                const docId = booking.doctor._id ? booking.doctor._id.toString() : booking.doctor.toString();
                const slotKey = `${docId}_${booking.appointmentTime.day?.toLowerCase()}_${booking.appointmentTime.startingTime}`;
                if (!processedKeys.has(slotKey)) {
                    processedKeys.add(slotKey);
                    
                    const bookingsForSlot = reportData.filter(b => {
                        const bDocId = b.doctor ? (b.doctor._id ? b.doctor._id.toString() : b.doctor.toString()) : null;
                        return bDocId === docId &&
                               b.appointmentTime?.day?.toLowerCase() === booking.appointmentTime.day?.toLowerCase() &&
                               b.appointmentTime?.startingTime === booking.appointmentTime.startingTime;
                    });
                    
                    const maxQueue = bookingsForSlot.reduce((max, b) => b.bookingNumber > max ? b.bookingNumber : max, 0);
                    const docInfo = doctors && doctors.find(d => d._id.toString() === docId);
                    
                    sessionsList.push({
                        day: booking.appointmentTime.day,
                        startingTime: booking.appointmentTime.startingTime,
                        endingTime: booking.appointmentTime.endingTime,
                        doctorName: docInfo?.name || booking.doctor.name || 'Unknown',
                        specialization: docInfo?.specialization || 'N/A',
                        patientsCount: bookingsForSlot.length,
                        maxQueue: maxQueue
                    });
                }
            });
            
            tableRows = sessionsList.map(slot => {
                let density = "Low Utilization";
                let color = "#16a34a";
                if (slot.patientsCount >= 15) {
                    density = "High Utilization (Busy)";
                    color = "#dc2626";
                } else if (slot.patientsCount >= 5) {
                    density = "Medium Utilization";
                    color = "#d97706";
                }
                return `
                    <tr>
                        <td><strong>${slot.day.toUpperCase()}</strong>: ${slot.startingTime} - ${slot.endingTime}</td>
                        <td>${slot.doctorName}</td>
                        <td style="text-transform: capitalize;">${slot.specialization}</td>
                        <td>${slot.patientsCount} patients</td>
                        <td>#${slot.maxQueue}</td>
                        <td><span style="font-weight: bold; color: ${color}">${density}</span></td>
                    </tr>
                `;
            }).join('');
        }

        const reportHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${reportName}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                        body {
                            font-family: 'Inter', sans-serif;
                            margin: 0;
                            padding: 40px;
                            color: #334155;
                            background-color: #fff;
                        }
                        .report-container {
                            max-width: 950px;
                            margin: 0 auto;
                            border: 1px solid #e2e8f0;
                            border-radius: 16px;
                            padding: 40px;
                            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                        }
                        .header {
                            text-align: center;
                            border-bottom: 2px solid #3b82f6;
                            padding-bottom: 24px;
                            margin-bottom: 30px;
                        }
                        .hospital-name {
                            font-size: 24px;
                            font-weight: 800;
                            color: #1e3a8a;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        .subtitle {
                            font-size: 13px;
                            color: #64748b;
                            margin-top: 6px;
                            line-height: 1.5;
                        }
                        .report-title {
                            font-size: 18px;
                            font-weight: 700;
                            color: #1e3a8a;
                            margin-top: 16px;
                            background-color: #eff6ff;
                            padding: 10px;
                            border-radius: 8px;
                            display: inline-block;
                            width: 90%;
                        }
                        .report-meta {
                            font-size: 12px;
                            color: #64748b;
                            margin-top: 8px;
                            font-weight: 500;
                        }
                        .details-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                            margin-bottom: 40px;
                            font-size: 12px;
                        }
                        .details-table th {
                            background-color: #f8fafc;
                            text-align: left;
                            padding: 10px 12px;
                            color: #475569;
                            font-weight: 700;
                            text-transform: uppercase;
                            font-size: 10px;
                            border: 1px solid #cbd5e1;
                        }
                        .details-table td {
                            padding: 10px 12px;
                            border: 1px solid #cbd5e1;
                            color: #334155;
                        }
                        .signature-section {
                            margin-top: 50px;
                            display: flex;
                            justify-content: space-between;
                            padding: 0 40px;
                        }
                        .signature-box {
                            text-align: center;
                        }
                        .signature-line {
                            border-top: 1px solid #475569;
                            width: 150px;
                            margin-bottom: 8px;
                        }
                        .signature-box p {
                            margin: 0;
                            font-size: 11px;
                            color: #64748b;
                            font-weight: 600;
                        }
                        @media print {
                            body {
                                padding: 0;
                                background-color: #fff;
                            }
                            .report-container {
                                border: none;
                                box-shadow: none;
                                padding: 0;
                                max-width: 100%;
                            }
                            @page {
                                margin: 15mm;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <div class="header">
                            <div class="hospital-name">Life Healthcare Medical Center</div>
                            <div class="subtitle">No.416/21, Weliweriya - Kirindiwela Rd, Weliweriya • Contact: 0333 555 429</div>
                            <div class="report-title">${reportName}</div>
                            <div class="report-meta">${periodTitle}</div>
                        </div>
                        
                        <table class="details-table">
                            <thead>
                                ${tableHeaders}
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                            ${tableFooter ? `<tfoot>${tableFooter}</tfoot>` : ''}
                        </table>
                        
                        <div class="signature-section">
                            <div class="signature-box">
                                <div class="signature-line"></div>
                                <p>Prepared Date</p>
                                <p style="font-size:9px; font-weight: normal; margin-top: 2px;">${new Date().toLocaleDateString()}</p>
                            </div>
                            <div class="signature-box">
                                <div class="signature-line"></div>
                                <p>Verified By</p>
                            </div>
                            <div class="signature-box">
                                <div class="signature-line"></div>
                                <p>Authorized Signature</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
        
        doc.open();
        doc.write(reportHtml);
        doc.close();
        
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }, 500);
    };

    const handlePrint = () => {
        const reportData = reportType === 'demographics' ? getFilteredPatients() : getFilteredBookings();
        handlePrintReport(reportType, timeFilter, selectedDate, selectedMonth, selectedYear, reportData);
    };

    const activeBookings = getFilteredBookings();
    const activePatients = getFilteredPatients();

    return (
        <section className="font-sans">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 print:hidden">
                <h2 className="text-3xl font-bold text-headingColor dark:text-white">Reports Panel</h2>
                <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto">
                    
                    <select 
                        value={reportType} 
                        onChange={(e) => setReportType(e.target.value)}
                        className="py-2 px-3.5 bg-primaryColor/10 border border-solid border-primaryColor/20 text-headingColor font-semibold rounded-xl focus:outline-none text-sm"
                    >
                        <option value="appointments">Doctor Appointment Summary</option>
                        <option value="payments">Payment & Revenue Summary</option>
                        <option value="demographics">Patient Demographics & Medical Summary</option>
                        <option value="performance">Doctor Performance & Workload</option>
                        <option value="sessions">Session & Slot Utilisation</option>
                    </select>

                    <select 
                        value={timeFilter} 
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="py-2 px-3.5 bg-primaryColor/10 border border-solid border-primaryColor/20 text-headingColor font-semibold rounded-xl focus:outline-none text-sm"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>

                    {timeFilter === 'monthly' && (
                        <>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="py-2 px-3.5 bg-primaryColor/10 border border-solid border-primaryColor/20 text-headingColor font-semibold rounded-xl focus:outline-none text-sm"
                            >
                                {monthNames.map((month, idx) => (
                                    <option key={idx} value={idx}>{month}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="py-2 px-3.5 bg-primaryColor/10 border border-solid border-primaryColor/20 text-headingColor font-semibold rounded-xl focus:outline-none text-sm"
                            >
                                {[2024, 2025, 2026, 2027, 2028].map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </>
                    )}

                    {(timeFilter === 'daily' || timeFilter === 'weekly') && (
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="py-1.5 px-3.5 bg-primaryColor/10 border border-solid border-primaryColor/20 text-headingColor font-semibold rounded-xl focus:outline-none text-sm"
                        />
                    )}

                    <button 
                        onClick={handlePrint}
                        className="bg-primaryColor text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-[#0052cc] transition-colors shadow-sm"
                    >
                        Print / Download Report
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center h-40">
                    <HashLoader size={45} color="#0067FF" />
                </div>
            )}
            {error && <p className="text-red-500 font-semibold text-center">{error}</p>}

            {!loading && !error && (
                <div className="bg-white border border-solid border-gray-100 shadow-md rounded-2xl p-8 text-black" id="printable-area">
                    
                    <div className="text-center mb-8 border-b border-solid border-gray-200 pb-6">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 uppercase tracking-wide mb-1.5">Life Healthcare Medical Center</h1>
                        <p className="text-gray-500 text-xs sm:text-sm">No.416/21, Weliweriya - Kirindiwela Rd, Weliweriya • Contact: 0333 555 429</p>
                        
                        <h2 className="text-xl sm:text-2xl font-black text-primaryColor mt-5 bg-primaryColor/5 border border-solid border-primaryColor/10 py-3 px-4 rounded-xl inline-block w-full">
                            {reportType === 'appointments' && 'Doctor Appointment Summary Report'}
                            {reportType === 'payments' && 'Payment & Revenue Summary Report'}
                            {reportType === 'demographics' && 'Patient Demographics & Medical Summary Report'}
                            {reportType === 'performance' && 'Doctor Performance & Workload Report'}
                            {reportType === 'sessions' && 'Session Scheduling & Slot Utilisation Report'}
                            
                            <span className="block text-xs text-textColor font-semibold mt-1 tracking-normal capitalize">
                                {timeFilter === 'daily' && `Daily Report: ${selectedDate}`}
                                {timeFilter === 'weekly' && `Weekly Report: Week of ${new Date(selectedDate).toLocaleDateString()}`}
                                {timeFilter === 'monthly' && `Monthly Report: ${monthNames[selectedMonth]} ${selectedYear}`}
                            </span>
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-solid border-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                {reportType === 'appointments' && (
                                    <tr>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Appt ID</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Patient Name</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Doctor Name</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Date & Time Slot</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Status</th>
                                    </tr>
                                )}
                                {reportType === 'payments' && (
                                    <tr>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Payment ID</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Appt ID</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Patient Name</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Payment Date</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Status</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Amount</th>
                                    </tr>
                                )}
                                {reportType === 'demographics' && (
                                    <tr>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Patient ID</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Patient Name</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Age / Gender</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Blood Group</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Contact Phone</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Allergies & Chronic Diseases</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Medications & Surgeries</th>
                                    </tr>
                                )}
                                {reportType === 'performance' && (
                                    <tr>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Doctor Name</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Specialization</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Ticket Price</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Bookings Count</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Completed Visits</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Est. Revenue</th>
                                    </tr>
                                )}
                                {reportType === 'sessions' && (
                                    <tr>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Time Slot</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Doctor Name</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Specialization</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Patients Count</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Peak Queue Position</th>
                                        <th className="px-4 py-3 border border-solid border-gray-200 font-bold text-gray-700">Density Status</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {reportType === 'appointments' && (
                                    activeBookings.length > 0 ? (
                                        activeBookings.map((booking) => (
                                            <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-mono font-bold text-xs text-primaryColor">
                                                    {booking.appointmentId || 'APT-Pending'}
                                                </td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-bold text-headingColor">{booking.user?.name || 'Unknown'}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-semibold text-gray-600">{booking.doctor?.name || 'Unknown'}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 text-xs">
                                                    {booking.appointmentDate ? dateFormat(booking.appointmentDate) : 'N/A'}{' '}
                                                    {booking.appointmentTime && (
                                                        <span className="bg-gray-100 text-textColor px-1.5 py-0.5 rounded ml-1 font-medium font-mono">
                                                            {booking.appointmentTime.startingTime} - {booking.appointmentTime.endingTime}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 text-xs">
                                                    <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                                                        booking.status === 'Completed' || booking.status === 'Confirmed' || booking.status === 'Approved'
                                                            ? 'bg-green-50 text-green-700 border-green-100'
                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                    }`}>
                                                        {booking.status || 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-10 text-textColor italic">
                                                No records found for the selected timeframe.
                                            </td>
                                        </tr>
                                    )
                                )}

                                {reportType === 'payments' && (
                                    activeBookings.length > 0 ? (
                                        activeBookings.map((booking) => (
                                            <tr key={booking._id} className="hover:bg-gray-50 transition-colors text-xs">
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-mono font-bold text-primaryColor">{booking.paymentId || 'PAY-Pending'}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-mono">{booking.appointmentId || 'APT-Pending'}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-semibold">{booking.user?.name || 'Unknown'}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200">{new Date(booking.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${booking.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {booking.isPaid ? 'Finished' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-bold font-mono">{booking.ticketPrice || 0} LKR</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-10 text-textColor italic">
                                                No records found for the selected timeframe.
                                            </td>
                                        </tr>
                                    )
                                )}

                                {reportType === 'demographics' && (
                                    activePatients.length > 0 ? (
                                        activePatients.map((patient) => (
                                            <tr key={patient._id} className="hover:bg-gray-50 transition-colors text-xs">
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-mono font-bold text-primaryColor">
                                                    {patient.patientId || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 border border-solid border-gray-200">
                                                    <div className="font-bold text-headingColor">{patient.name || 'Unknown'}</div>
                                                    <div className="text-[10px] text-textColor font-mono">{patient.email}</div>
                                                </td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 capitalize font-medium">{patient.age || 'N/A'} yrs / {patient.gender || 'N/A'}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-bold text-primaryColor">{patient.bloodType || 'N/A'}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-mono">{patient.phone || 'N/A'}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 text-[11px]">
                                                    <div className="mb-1"><strong>Allergies:</strong> {patient.allergies || 'None'}</div>
                                                    <div><strong>Chronic:</strong> {patient.chronicDiseases || 'None'}</div>
                                                </td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 text-[11px]">
                                                    <div className="mb-1"><strong>Medications:</strong> {patient.currentMedications || 'None'}</div>
                                                    <div><strong>Surgeries:</strong> {patient.previousSurgeries || 'None'}</div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-10 text-textColor italic">
                                                No records found for the selected timeframe.
                                            </td>
                                        </tr>
                                    )
                                )}

                                {reportType === 'performance' && (() => {
                                    const doctorPerformance = {};
                                    if (doctors && Array.isArray(doctors)) {
                                        doctors.forEach(doc => {
                                            doctorPerformance[doc._id.toString()] = {
                                                name: doc.name || 'Unknown',
                                                specialization: doc.specialization || 'N/A',
                                                ticketPrice: doc.ticketPrice || 0,
                                                bookingsCount: 0,
                                                completedCount: 0,
                                                revenue: 0
                                            };
                                        });
                                    }
                                    activeBookings.forEach(booking => {
                                        if (!booking.doctor) return;
                                        const docId = booking.doctor._id ? booking.doctor._id.toString() : booking.doctor.toString();
                                        if (!doctorPerformance[docId]) {
                                            const docInfo = doctors && doctors.find(d => d._id.toString() === docId);
                                            doctorPerformance[docId] = {
                                                name: docInfo?.name || booking.doctor.name || 'Unknown',
                                                specialization: docInfo?.specialization || 'N/A',
                                                ticketPrice: docInfo?.ticketPrice || booking.ticketPrice || 0,
                                                bookingsCount: 0,
                                                completedCount: 0,
                                                revenue: 0
                                            };
                                        }
                                        doctorPerformance[docId].bookingsCount += 1;
                                        if (booking.status === 'Completed') {
                                            doctorPerformance[docId].completedCount += 1;
                                            doctorPerformance[docId].revenue += Number(booking.ticketPrice || 0);
                                        }
                                    });
                                    const perfList = Object.values(doctorPerformance);
                                    if (perfList.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="6" className="text-center py-10 text-textColor italic">
                                                    No doctors found.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return perfList.map(doc => (
                                        <tr key={doc.name} className="hover:bg-gray-50 transition-colors text-xs">
                                            <td className="px-4 py-3 border border-solid border-gray-200 font-bold text-headingColor">{doc.name}</td>
                                            <td className="px-4 py-3 border border-solid border-gray-200 capitalize">{doc.specialization}</td>
                                            <td className="px-4 py-3 border border-solid border-gray-200 font-mono font-semibold">{doc.ticketPrice} LKR</td>
                                            <td className="px-4 py-3 border border-solid border-gray-200 font-bold">{doc.bookingsCount}</td>
                                            <td className="px-4 py-3 border border-solid border-gray-200 font-bold text-green-700">{doc.completedCount}</td>
                                            <td className="px-4 py-3 border border-solid border-gray-200 font-bold font-mono text-primaryColor">{doc.revenue} LKR</td>
                                        </tr>
                                    ));
                                })()}

                                {reportType === 'sessions' && (() => {
                                    const sessionsList = [];
                                    const processedKeys = new Set();
                                    
                                    if (doctors && Array.isArray(doctors)) {
                                        doctors.forEach(doc => {
                                            if (doc.timeSlots && Array.isArray(doc.timeSlots)) {
                                                doc.timeSlots.forEach(slot => {
                                                    const slotKey = `${doc._id.toString()}_${slot.day?.toLowerCase()}_${slot.startingTime}`;
                                                    processedKeys.add(slotKey);
                                                    
                                                    const bookingsForSlot = activeBookings.filter(b => {
                                                        const bDocId = b.doctor ? (b.doctor._id ? b.doctor._id.toString() : b.doctor.toString()) : null;
                                                        return bDocId === doc._id.toString() &&
                                                               b.appointmentTime?.day?.toLowerCase() === slot.day?.toLowerCase() &&
                                                               b.appointmentTime?.startingTime === slot.startingTime;
                                                    });
                                                    
                                                    const maxQueue = bookingsForSlot.reduce((max, b) => b.bookingNumber > max ? b.bookingNumber : max, 0);
                                                    
                                                    sessionsList.push({
                                                        day: slot.day,
                                                        startingTime: slot.startingTime,
                                                        endingTime: slot.endingTime,
                                                        doctorName: doc.name || 'Unknown',
                                                        specialization: doc.specialization || 'N/A',
                                                        patientsCount: bookingsForSlot.length,
                                                        maxQueue: maxQueue
                                                    });
                                                });
                                            }
                                        });
                                    }
                                    
                                    activeBookings.forEach(booking => {
                                        if (!booking.appointmentTime || !booking.doctor) return;
                                        const docId = booking.doctor._id ? booking.doctor._id.toString() : booking.doctor.toString();
                                        const slotKey = `${docId}_${booking.appointmentTime.day?.toLowerCase()}_${booking.appointmentTime.startingTime}`;
                                        if (!processedKeys.has(slotKey)) {
                                            processedKeys.add(slotKey);
                                            
                                            const bookingsForSlot = activeBookings.filter(b => {
                                                const bDocId = b.doctor ? (b.doctor._id ? b.doctor._id.toString() : b.doctor.toString()) : null;
                                                return bDocId === docId &&
                                                       b.appointmentTime?.day?.toLowerCase() === booking.appointmentTime.day?.toLowerCase() &&
                                                       b.appointmentTime?.startingTime === booking.appointmentTime.startingTime;
                                            });
                                            
                                            const maxQueue = bookingsForSlot.reduce((max, b) => b.bookingNumber > max ? b.bookingNumber : max, 0);
                                            const docInfo = doctors && doctors.find(d => d._id.toString() === docId);
                                            
                                            sessionsList.push({
                                                day: booking.appointmentTime.day,
                                                startingTime: booking.appointmentTime.startingTime,
                                                endingTime: booking.appointmentTime.endingTime,
                                                doctorName: docInfo?.name || booking.doctor.name || 'Unknown',
                                                specialization: docInfo?.specialization || 'N/A',
                                                patientsCount: bookingsForSlot.length,
                                                maxQueue: maxQueue
                                            });
                                        }
                                    });
                                    
                                    if (sessionsList.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="6" className="text-center py-10 text-textColor italic">
                                                    No scheduling sessions found.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    
                                    return sessionsList.map(slot => {
                                        let density = "Low Density";
                                        let badgeColor = "bg-green-50 text-green-700 border-green-100";
                                        if (slot.patientsCount >= 15) {
                                            density = "High Density (Busy)";
                                            badgeColor = "bg-red-50 text-red-700 border-red-100";
                                        } else if (slot.patientsCount >= 5) {
                                            density = "Medium Density";
                                            badgeColor = "bg-yellow-50 text-yellow-700 border-yellow-100";
                                        }
                                        return (
                                            <tr key={`${slot.doctorName}_${slot.day}_${slot.startingTime}`} className="hover:bg-gray-50 transition-colors text-xs">
                                                <td className="px-4 py-3 border border-solid border-gray-200 capitalize font-semibold">
                                                    {slot.day}: {slot.startingTime} - {slot.endingTime}
                                                </td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-bold text-headingColor">{slot.doctorName}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 capitalize">{slot.specialization}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-mono font-bold text-primaryColor">{slot.patientsCount} patients</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200 font-mono">#{slot.maxQueue}</td>
                                                <td className="px-4 py-3 border border-solid border-gray-200">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>{density}</span>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                            
                            {reportType === 'payments' && activeBookings.length > 0 && (
                                <tfoot>
                                    <tr className="bg-gray-50 font-bold text-gray-800">
                                        <td colSpan="5" className="px-4 py-3 border border-solid border-gray-200 text-right text-xs">Total Generated Revenue:</td>
                                        <td className="px-4 py-3 border border-solid border-gray-200 font-mono font-black text-sm text-primaryColor">
                                            {activeBookings.reduce((sum, booking) => sum + (booking.isPaid ? Number(booking.ticketPrice || 0) : 0), 0)} LKR
                                        </td>
                                    </tr>
                                </tfoot>
                            )}

                            {reportType === 'demographics' && activePatients.length > 0 && (
                                <tfoot>
                                    <tr className="bg-gray-50 font-bold text-gray-800">
                                        <td colSpan="6" className="px-4 py-3 border border-solid border-gray-200 text-right text-xs">Total Patients Listed:</td>
                                        <td className="px-4 py-3 border border-solid border-gray-200 font-mono font-black text-sm text-primaryColor">
                                            {activePatients.length}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}

                            {reportType === 'performance' && activeBookings.length > 0 && (
                                <tfoot>
                                    <tr className="bg-gray-50 font-bold text-gray-800">
                                        <td colSpan="3" className="px-4 py-3 border border-solid border-gray-200 text-right text-xs">Total Across All Doctors:</td>
                                        <td className="px-4 py-3 border border-solid border-gray-200 font-mono font-black text-xs">
                                            {activeBookings.length} Bookings
                                        </td>
                                        <td className="px-4 py-3 border border-solid border-gray-200 font-mono font-black text-xs text-green-700">
                                            {activeBookings.filter(b => b.status === 'Completed').length} Completed
                                        </td>
                                        <td className="px-4 py-3 border border-solid border-gray-200 font-mono font-black text-sm text-primaryColor">
                                            {activeBookings.reduce((sum, booking) => sum + (booking.status === 'Completed' ? Number(booking.ticketPrice || 0) : 0), 0)} LKR
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    <div className="mt-16 flex flex-col sm:flex-row justify-between px-10 gap-8">
                        <div className="text-center sm:text-left">
                            <div className="border-t border-solid border-gray-400 w-40 pt-2 mb-1 mx-auto sm:mx-0"></div>
                            <p className="font-bold text-gray-700 text-xs">Prepared Date</p>
                            <p className="text-gray-400 text-[10px] font-medium mt-0.5">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="text-center sm:text-left">
                            <div className="border-t border-solid border-gray-400 w-40 pt-2 mb-1 mx-auto sm:mx-0"></div>
                            <p className="font-bold text-gray-700 text-xs">Verified By</p>
                        </div>
                        <div className="text-center sm:text-left">
                            <div className="border-t border-solid border-gray-400 w-40 pt-2 mb-1 mx-auto sm:mx-0"></div>
                            <p className="font-bold text-gray-700 text-xs">Authorized Signature</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Reports;
