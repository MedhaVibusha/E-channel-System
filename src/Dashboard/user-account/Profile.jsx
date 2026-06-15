import React, { useEffect, useState } from "react";
import uploadImageToCloudinary from "../../../utils/uploadImageToCloudinary";
import { BASE_URL } from "../../config";
import { toast } from "react-toastify";
import Hashloader from "react-spinners/HashLoader.js";
import { AiOutlineDelete, AiOutlineFile, AiOutlineCloudUpload } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

const Profile = ({ user, isRegisterMode = false }) => {
  const navigate = useNavigate();
  const isBloodTypeLocked = !isRegisterMode && !!(user && user.bloodType);
  const isGenderLocked = !isRegisterMode && !!(user && user.gender);
  const isDobLocked = !isRegisterMode && !!(user && user.dob);

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    photo: null,
    gender: "",
    bloodType: "",
    phone: "",
    dob: "",
    age: "",
    address: "",
    allergies: "",
    chronicDiseases: "",
    previousSurgeries: "",
    currentMedications: "",
    medicalReports: [],
  });

  // Safe date formatting utility to convert DB date to YYYY-MM-DD
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

  // Age calculation logic
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

  useEffect(() => {
    if (user) {
      // Sanitize phone number to get raw 9 digits
      let initialPhone = user.phone ? String(user.phone).trim() : "";
      if (initialPhone.startsWith("+94")) {
        initialPhone = initialPhone.substring(3);
      } else if (initialPhone.startsWith("94")) {
        initialPhone = initialPhone.substring(2);
      } else if (initialPhone.startsWith("0")) {
        initialPhone = initialPhone.substring(1);
      }
      initialPhone = initialPhone.replace(/\D/g, "").substring(0, 9);

      setFormData({
        name: user.name || "",
        email: user.email || "",
        photo: user.photo || null,
        gender: user.gender || "",
        bloodType: user.bloodType || "",
        phone: initialPhone,
        dob: formatDate(user.dob),
        age: user.age || (user.dob ? calculateAge(user.dob) : ""),
        address: user.address || "",
        allergies: user.allergies || "",
        chronicDiseases: user.chronicDiseases || "",
        previousSurgeries: user.previousSurgeries || "",
        currentMedications: user.currentMedications || "",
        medicalReports: user.medicalReports || [],
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData({ ...formData, name: sanitizedValue });
    } else if (name === "dob") {
      const calculatedAge = calculateAge(value);
      setFormData({ ...formData, dob: value, age: calculatedAge });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePhoneInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Allow only digits
    if (value.length <= 9) {
      setFormData({ ...formData, phone: value });
    }
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const data = await uploadImageToCloudinary(file);
      setSelectedFile(data.url);
      setFormData({ ...formData, photo: data.url });
      toast.success("Profile photo uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload photo.");
    } finally {
      setLoading(false);
    }
  };

  const handleReportUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadingReport(true);
    try {
      const data = await uploadImageToCloudinary(file);
      if (data && data.url) {
        setFormData((prev) => ({
          ...prev,
          medicalReports: [...(prev.medicalReports || []), data.url],
        }));
        toast.success("Medical report uploaded successfully!");
      } else {
        toast.error("Failed to upload medical report.");
      }
    } catch (err) {
      toast.error("Error uploading medical report.");
    } finally {
      setUploadingReport(false);
    }
  };

  const deleteReport = (indexToDelete) => {
    setFormData((prev) => ({
      ...prev,
      medicalReports: prev.medicalReports.filter((_, idx) => idx !== indexToDelete),
    }));
    toast.success("Medical report removed.");
  };

  const submitHandler = async (event) => {
    event.preventDefault();

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(formData.name)) {
      toast.error("Full name can only contain letters and spaces.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email address must be a valid @gmail.com account.");
      return;
    }

    if (isRegisterMode && !formData.password) {
      toast.error("Password is required for registration.");
      return;
    }

    if (formData.phone && formData.phone.length !== 9) {
      toast.error("Contact number must be exactly 9 digits.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const submissionData = {
        ...formData,
        phone: formData.phone ? `+94${formData.phone}` : "",
      };

      const url = isRegisterMode ? `${BASE_URL}/admin/patients` : `${BASE_URL}/users/${user._id}`;
      const method = isRegisterMode ? "POST" : "PUT";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      const { message } = await res.json();

      if (!res.ok) {
        throw new Error(message);
      }

      setLoading(false);
      toast.success(isRegisterMode ? "Patient Registered Successfully!" : message);
      if (isRegisterMode) {
        navigate("/admin/patients");
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
      setLoading(false);
    }
  };

  // Extracts file name from Cloudinary URL for cleaner display
  const getFileName = (url) => {
    if (!url) return "";
    try {
      const decodedUrl = decodeURIComponent(url);
      const parts = decodedUrl.split("/");
      const lastPart = parts[parts.length - 1];
      // strip cloudinary public ID suffix if present
      return lastPart.split("?")[0];
    } catch (e) {
      return "Medical Report Document";
    }
  };

  return (
    <div className="mt-8">
      {isRegisterMode && (
        <h2 className="text-headingColor font-bold text-[24px] leading-9 mb-6">
          Register Patient
        </h2>
      )}
      <form onSubmit={submitHandler}>

        {/* Section 1: Personal Information */}
        <div className="mb-8 border-b border-solid border-[#0066ff1a] pb-6">
          <h3 className="text-headingColor font-bold text-[18px] leading-7 mb-4">
            1. Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="form_label">Full Name *</p>
              <input
                type="text"
                placeholder="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form_input"
              />
            </div>
            <div>
              <p className="form_label">Email Address *</p>
              <input
                type="email"
                placeholder="Email Address"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="form_input"
              />
            </div>
            <div>
              <p className="form_label">Contact Number *</p>
              <div className="flex items-center">
                <span className="flex items-center justify-center bg-gray-200 border border-r-0 border-solid border-[#0066ff61] rounded-l-[8px] px-3.5 py-3 text-headingColor font-semibold text-[16px] leading-7 select-none">
                  +94
                </span>
                <input
                  type="text"
                  placeholder="7XXXXXXXX"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneInputChange}
                  required
                  maxLength={9}
                  className="w-full px-4 py-3 border rounded-r-[8px] border-solid border-[#0066ff61] focus:outline-none focus:border-primaryColor text-[16px] leading-7 text-headingColor placeholder:text-textColor cursor-pointer"
                />
              </div>
            </div>
            <div>
              <p className="form_label">{isRegisterMode ? "Password *" : "Password (Leave blank to keep unchanged)"}</p>
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={isRegisterMode}
                className="form_input"
              />
            </div>
          </div>

          <div className="mt-5">
            <p className="form_label font-semibold">Address *</p>
            <input
              type="text"
              placeholder="Physical Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="form_input"
            />
          </div>

          <div className="mt-5 flex items-center gap-3">
            {formData.photo && (
              <figure className="w-[50px] h-[50px] rounded-full border-2 border-solid border-primaryColor flex items-center justify-center">
                <img
                  src={formData.photo}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              </figure>
            )}

            <div className="relative w-[130px] h-[50px]">
              <input
                type="file"
                name="photo"
                id="customFile"
                onChange={handleFileInputChange}
                accept=".jpg, .png"
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
              <label
                htmlFor="customFile"
                className="absolute top-0 left-0 w-full h-full flex items-center px-[0.75rem] py-[0.375rem] text-[15px] leading-6 overflow-hidden bg-[#0066ff46] text-headingColor font-semibold rounded-lg truncate cursor-pointer"
              >
                Upload Photo
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Medical Details */}
        <div className="mb-8 border-b border-solid border-[#0066ff1a] pb-6">
          <h3 className="text-headingColor font-bold text-[18px] leading-7 mb-4">
            2. Medical Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <p className="form_label">Blood Group *</p>
              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleInputChange}
                required
                disabled={isBloodTypeLocked}
                className={`form_input py-3 ${isBloodTypeLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
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
              <p className="form_label">Gender *</p>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                disabled={isGenderLocked}
                className={`form_input py-3 ${isGenderLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <p className="form_label">Date of Birth *</p>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                required
                disabled={isDobLocked}
                className={`form_input ${isDobLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </div>
            <div>
              <p className="form_label">Age (Calculated)</p>
              <input
                type="number"
                name="age"
                value={formData.age}
                readOnly
                disabled
                placeholder="Age"
                className="form_input bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Clinical History */}
        <div className="mb-8 border-b border-solid border-[#0066ff1a] pb-6">
          <h3 className="text-headingColor font-bold text-[18px] leading-7 mb-4">
            3. Clinical History
          </h3>
          <div className="space-y-4">
            <div>
              <p className="form_label">Allergies (e.g. food, drug, contact allergies)</p>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                placeholder="List any known allergies..."
                rows={2}
                className="form_input"
              />
            </div>
            <div>
              <p className="form_label">Chronic Diseases (e.g. Diabetes, Hypertension, Asthma)</p>
              <textarea
                name="chronicDiseases"
                value={formData.chronicDiseases}
                onChange={handleInputChange}
                placeholder="List any chronic medical conditions..."
                rows={2}
                className="form_input"
              />
            </div>
            <div>
              <p className="form_label">Previous Operations / Surgeries</p>
              <textarea
                name="previousSurgeries"
                value={formData.previousSurgeries}
                onChange={handleInputChange}
                placeholder="List any previous operations or surgical procedures..."
                rows={2}
                className="form_input"
              />
            </div>
            <div>
              <p className="form_label">Current Medications (e.g. insulin, metformin, atorvastatin)</p>
              <textarea
                name="currentMedications"
                value={formData.currentMedications}
                onChange={handleInputChange}
                placeholder="List any current medications..."
                rows={2}
                className="form_input"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Medical Documents */}
        <div className="mb-8">
          <h3 className="text-headingColor font-bold text-[18px] leading-7 mb-4">
            4. Medical Documents
          </h3>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-[200px] h-[50px]">
                <input
                  type="file"
                  name="report"
                  id="reportFile"
                  onChange={handleReportUpload}
                  accept=".jpg, .png, .jpeg, .pdf"
                  disabled={uploadingReport}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="reportFile"
                  className="absolute top-0 left-0 w-full h-full flex items-center justify-center gap-2 px-[0.75rem] py-[0.375rem] text-[15px] leading-6 overflow-hidden bg-[#0066ff26] hover:bg-[#0066ff3d] text-primaryColor font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  {uploadingReport ? (
                    <Hashloader size={20} color="#0066ff" />
                  ) : (
                    <>
                      <AiOutlineCloudUpload className="text-[20px]" />
                      Upload Report
                    </>
                  )}
                </label>
              </div>
              <p className="text-textColor text-[14px]">Supports PDF, JPG, PNG, JPEG formats.</p>
            </div>

            {/* List of uploaded reports */}
            {formData.medicalReports && formData.medicalReports.length > 0 ? (
              <div className="mt-4 border border-solid border-gray-200 rounded-lg p-4 bg-gray-50 max-h-[250px] overflow-y-auto">
                <p className="font-semibold text-headingColor text-[15px] mb-3">Uploaded Reports ({formData.medicalReports.length})</p>
                <ul className="space-y-2">
                  {formData.medicalReports.map((reportUrl, index) => (
                    <li key={index} className="flex items-center justify-between p-2.5 bg-white border border-solid border-gray-100 rounded-md shadow-sm">
                      <a
                        href={reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primaryColor hover:underline text-[14px] font-medium truncate max-w-[80%]"
                      >
                        <AiOutlineFile className="text-[18px] shrink-0 text-gray-500" />
                        <span className="truncate">{getFileName(reportUrl)}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => deleteReport(index)}
                        className="bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded-full transition-colors"
                        title="Remove report"
                      >
                        <AiOutlineDelete className="text-[16px]" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-textColor text-[14px] italic mt-2">No medical reports uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            disabled={loading || uploadingReport}
            type="submit"
            className="w-full px-4 py-3 bg-primaryColor text-white text-[18px] leading-[30px] rounded-lg hover:bg-[#0052cc] transition-colors"
          >
            {loading ? <Hashloader size={25} color="#ffffff" /> : (isRegisterMode ? "Register Patient" : "Update Profile")}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Profile;
