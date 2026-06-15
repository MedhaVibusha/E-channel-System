import { useEffect, useState } from "react";
import { AiOutlineDelete } from "react-icons/ai";
import uploadImageToCloudinary from "../../../utils/uploadImageToCloudinary";
import { BASE_URL } from "./../../config";
import { toast } from "react-toastify";
import Hashloader from "react-spinners/HashLoader.js";
import { useNavigate } from "react-router-dom";

const Profile = ({ doctorData, isRegisterMode = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
    gender: "",
    specialization: "",
    ticketPrice: 0,
    qualifications: [],
    experiences: [],
    timeSlots: [],
    about: "",
    photo: null,
  });

  useEffect(() => {
    setFormData({
      name: doctorData?.name || "",
      email: doctorData?.email || "",
      phone: doctorData?.phone || "",
      bio: doctorData?.bio || "",
      gender: doctorData?.gender || "",
      specialization: doctorData?.specialization || "",
      ticketPrice: doctorData?.ticketPrice,
      qualifications: doctorData?.qualifications || [],
      experiences: doctorData?.experiences || [],
      timeSlots: doctorData?.timeSlots || [],
      about: doctorData?.about || "",
      photo: doctorData?.photo || null,
    });
  }, [doctorData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData({ ...formData, name: sanitizedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    const data = await uploadImageToCloudinary(file);

    setFormData({ ...formData, photo: data?.url });
  };

  const updateProfileHandler = async (e) => {
    e.preventDefault();

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

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = isRegisterMode ? `${BASE_URL}/admin/doctors` : `${BASE_URL}/doctors/${doctorData._id}`;
      const method = isRegisterMode ? "POST" : "PUT";

      const res = await fetch(url, {
        method: method,
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw Error(result.message);
      }

      toast.success(isRegisterMode ? "Doctor Registered Successfully!" : "Successfully Updated!");
      setLoading(false);
      if (isRegisterMode) {
        navigate("/admin/doctors");
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (err) {
      toast.error(err.message || "An Error Occured");
      setLoading(false);
    }
  };

  // reusable function for adding items
  const addItem = (key, item) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [key]: [...prevFormData[key], item],
    }));
  };

  // reusable input change function
  const handleReusableInputChangeFunc = (key, index, event) => {
    const { name, value } = event.target;

    setFormData((prevFormData) => {
      const updateItems = [...prevFormData[key]];

      updateItems[index][name] = value;

      return {
        ...prevFormData,
        [key]: updateItems,
      };
    });
  };

  // reusable function for deleting items
  const deleteItem = (key, index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [key]: prevFormData[key].filter((_, i) => i !== index),
    }));
  };

  const addQualification = (e) => {
    e.preventDefault();

    addItem("qualifications", {
      startingDate: "",
      endingDate: "",
      degree: "PHD",
      university: "Sabaragamuwa University of Sri Lanka",
    });
  };

  const handleQualificationChange = (event, index) => {
    handleReusableInputChangeFunc("qualifications", index, event);
  };

  const deleteQualification = (e, index) => {
    e.preventDefault();
    deleteItem("qualifications", index);
  };

  const addExperience = (e) => {
    e.preventDefault();

    addItem("experiences", {
      startingDate: "",
      endingDate: "",
      position: "Senior Surgeon",
      hospital: "Pambahinna Medical center",
    });
  };

  const handleExperienceChange = (event, index) => {
    handleReusableInputChangeFunc("experiences", index, event);
  };

  const deleteExperience = (e, index) => {
    e.preventDefault();
    deleteItem("experiences", index);
  };

  const addTimeSlot = (e) => {
    e.preventDefault();

    addItem("timeSlots", {
      day: "Sunday",
      startingTime: "10:00",
      endingTime: "04.30",
    });
  };

  const handleTimeSlotChange = (event, index) => {
    handleReusableInputChangeFunc("timeSlots", index, event);
  };

  const deleteTimeSlot = (e, index) => {
    e.preventDefault();
    deleteItem("timeSlots", index);
  };

  return (
    <div>
      <h2 className="text-headingColor font-bold text-[24px] leading-9 mb-10">
        {isRegisterMode ? "Doctor Registration" : "Profile Information"}
      </h2>

      <form>
        <div className="mb-5">
          <p className="form_label">Name *</p>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Full Name"
            className="form_input"
          />
        </div>
        <div className="mb-5">
          <p className="form_label">Email *</p>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            className="form_input"
          />
        </div>
        {isRegisterMode && (
          <div className="mb-5">
            <p className="form_label">Password *</p>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              className="form_input"
              required
            />
          </div>
        )}
        <div className="mb-5">
          <p className="form_label">Mobile Number *</p>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Mobile Number"
            className="form_input"
          />
        </div>
        <div className="mb-5">
          <p className="form_label">Bio *</p>
          <input
            type="text"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Bio"
            className="form_input"
            maxLength={150}
          />
        </div>

        <div className="mb-5">
          <div className="grid grid-cols-3 gap-5 mb-[30px]">
            <div>
              <p className="form_label">Gender *</p>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="form_input py-3.5"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <p className="form_label">Specialization *</p>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                className="form_input py-3.5"
              >
                <option value="">Select</option>
                <option value="general-physician">General Physician</option>
                <option value="ophthalmologist">Ophthalmologist (Eye Specialist)</option>
                <option value="cardiologist">Cardiologist (Heart Specialist)</option>
                <option value="dermatologist">Dermatologist (Skin Specialist)</option>
                <option value="pediatrician">Pediatrician (Child Specialist)</option>
                <option value="gynecologist">Gynecologist (Women’s Health)</option>
                <option value="orthopedic-surgeon">Orthopedic Surgeon (Bones & Joints)</option>
                <option value="neurologist">Neurologist (Brain & Nerves)</option>
                <option value="ent-specialist">ENT Specialist (Ear, Nose, Throat)</option>
                <option value="psychiatrist">Psychiatrist (Mental Health)</option>
                <option value="dentist">Dentist (Dental Care)</option>
                <option value="urologist">Urologist (Urinary System)</option>
                <option value="endocrinologist">Endocrinologist (Hormones & Diabetes)</option>
                <option value="gastroenterologist">Gastroenterologist (Digestive System)</option>
              </select>
            </div>
            <div>
              <p className="form_label">Ticket Price *</p>
              <input
                type="number"
                placeholder="100"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleInputChange}
                className="form_input"
              ></input>
            </div>
          </div>
        </div>

        {/* qualifications */}
        <div className="mb-5">
          <p className="form_label">Qualifications *</p>
          {formData.qualifications?.map((item, index) => (
            <div key={index}>
              <div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="form_label">Starting Date *</p>
                    <input
                      type="date"
                      name="startingDate"
                      value={item.startingDate}
                      className="form_input"
                      onChange={(e) => handleQualificationChange(e, index)}
                    ></input>
                  </div>
                  <div>
                    <p className="form_label">Ending Date *</p>
                    <input
                      type="date"
                      name="endingDate"
                      value={item.endingDate}
                      className="form_input"
                      onChange={(e) => handleQualificationChange(e, index)}
                    ></input>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mt-5">
                  <div>
                    <p className="form_label">Degree *</p>
                    <input
                      type="text"
                      name="degree"
                      value={item.degree}
                      className="form_input"
                      onChange={(e) => handleQualificationChange(e, index)}
                    ></input>
                  </div>
                  <div>
                    <p className="form_label">University *</p>
                    <input
                      type="text"
                      name="university"
                      value={item.university}
                      className="form_input"
                      onChange={(e) => handleQualificationChange(e, index)}
                    ></input>
                  </div>
                </div>

                <button
                  onClick={(e) => deleteQualification(e, index)}
                  className="bg-red-600 p-2 rounded-full text-white text-[18px] mt-2 mb-[30px] cursor-pointer"
                >
                  <AiOutlineDelete />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addQualification}
            className="bg-[#000] py-2  px-5 rounded-full text-white text-[18px] mt-2 mb-[30px] cursor-pointer"
          >
            Add Qualification
          </button>
        </div>

        {/* experiences */}
        <div className="mb-5">
          <p className="form_label">Experiences *</p>
          {formData.experiences?.map((item, index) => (
            <div key={index}>
              <div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="form_label">Starting Date *</p>
                    <input
                      type="date"
                      name="startingDate"
                      value={item.startingDate}
                      className="form_input"
                      onChange={(e) => handleExperienceChange(e, index)}
                    ></input>
                  </div>
                  <div>
                    <p className="form_label">Ending Date *</p>
                    <input
                      type="date"
                      name="endingDate"
                      value={item.endingDate}
                      className="form_input"
                      onChange={(e) => handleExperienceChange(e, index)}
                    ></input>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mt-5">
                  <div>
                    <p className="form_label">Position *</p>
                    <input
                      type="text"
                      name="position"
                      value={item.position}
                      className="form_input"
                      onChange={(e) => handleExperienceChange(e, index)}
                    ></input>
                  </div>
                  <div>
                    <p className="form_label">Hospital *</p>
                    <input
                      type="text"
                      name="hospital"
                      value={item.hospital}
                      className="form_input"
                      onChange={(e) => handleExperienceChange(e, index)}
                    ></input>
                  </div>
                </div>

                <button
                  onClick={(e) => deleteExperience(e, index)}
                  className="bg-red-600 p-2 rounded-full text-white text-[18px] mt-2 mb-[30px] cursor-pointer"
                >
                  <AiOutlineDelete />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addExperience}
            className="bg-[#000] py-2  px-5 rounded-full text-white text-[18px] mt-2 mb-[30px] cursor-pointer"
          >
            {/* {" "} */}
            Add Experiences
          </button>
        </div>

        {/* time slots */}
        <div className="mb-5">
          <p className="form_label">Time Slots *</p>
          {formData.timeSlots?.map((item, index) => (
            <div key={index}>
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 mb-[30px] gap-5">
                  <div>
                    <p className="form_label">Day *</p>
                    <select
                      name="day"
                      value={item.day}
                      className="form_input py-3.5"
                      onChange={(e) => handleTimeSlotChange(e, index)}
                    >
                      <option value="">Select</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="friday">Friday</option>
                    </select>
                  </div>
                  <div>
                    <p className="form_label">Starting Time *</p>
                    <input
                      type="time"
                      name="startingTime"
                      value={item.startingTime}
                      className="form_input"
                      onChange={(e) => handleTimeSlotChange(e, index)}
                    ></input>
                  </div>
                  <div>
                    <p className="form_label">Ending Time *</p>
                    <input
                      type="time"
                      name="endingTime"
                      value={item.endingTime}
                      className="form_input"
                      onChange={(e) => handleTimeSlotChange(e, index)}
                    ></input>
                  </div>

                  <div
                    onClick={(e) => deleteTimeSlot(e, index)}
                    className="flex items-center"
                  >
                    <button className="bg-red-600 p-2 rounded-full text-white text-[18px] mt-2 mb-[30px] cursor-pointer">
                      <AiOutlineDelete />
                    </button>
                  </div>
                </div>

                {/* <div className="grid grid-cols-2 gap-5 mt-5">
                  <div>
                    <p className="form_label">Position *</p>
                    <input
                      type="text"
                      name="position"
                      value={item.position}
                      className="form_input"
                    ></input>
                  </div>
                  <div>
                    <p className="form_label">Hospital *</p>
                    <input
                      type="text"
                      name="hospital"
                      value={item.hospital}
                      className="form_input"
                    ></input>
                  </div>
                </div> */}
              </div>
            </div>
          ))}

          <button
            onClick={addTimeSlot}
            className="bg-[#000] py-2  px-5 rounded-full text-white text-[18px] mt-2 mb-[30px] cursor-pointer"
          >
            {/* {" "} */}
            Add Time Slot
          </button>
        </div>

        {/* start about section here  */}
        <div className="mb-5">
          <p className="form__label">About*</p>
          <textarea
            name="about"
            rows={5}
            value={formData.about}
            placeholder="Write about you"
            onChange={handleInputChange}
            className="form_input "
          ></textarea>
        </div>

        <div className="mb-5 flex items-center gap-3">
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

        <div className="mt-7">
          <button
            type="submit"
            onClick={updateProfileHandler}
            className="bg-primaryColor text-white text-[18px] leading-[30px] w-full py-3 px-4 rounded-lg"
          >
            {loading ? <Hashloader size={25} color="#ffffff" /> : (isRegisterMode ? "Register Doctor" : "Update Profile")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
