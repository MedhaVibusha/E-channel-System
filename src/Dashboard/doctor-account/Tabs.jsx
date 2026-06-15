import React from "react";
import { BiMenu } from "react-icons/bi";
import { useContext } from "react";
import { authContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Tabs = ({ tab, setTab }) => {
  const { dispatch } = useContext(authContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login");
  };

  return (
    <div>
      <span className="lg:hidden">
        <BiMenu className="w-6 h-6 cursor-pointer" />
      </span>
      <div className="hidden lg:flex flex-col p-[30px] bg-white shadow-panelShadow items-center h-max rounded-md ">
        <button
          onClick={() => setTab("overview")}
          className={`${tab === "overview"
              ? "bg-indigo-100 text-primaryColor font-bold"
              : "bg-transparent text-headingColor"
            } w-full btn mt-0 rounded-md`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("appointments")}
          className={`${tab === "appointments"
              ? "bg-indigo-100 text-primaryColor font-bold"
              : "bg-transparent text-headingColor"
            } w-full btn mt-0 rounded-md`}
        >
          Appointments
        </button>
        <button
          onClick={() => setTab("patient-emr")}
          className={`${tab === "patient-emr"
              ? "bg-indigo-100 text-primaryColor font-bold"
              : "bg-transparent text-headingColor"
            } w-full btn mt-0 rounded-md`}
        >
          Clinical History
        </button>
        <button
          onClick={() => setTab("schedule-management")}
          className={`${tab === "schedule-management"
              ? "bg-indigo-100 text-primaryColor font-bold"
              : "bg-transparent text-headingColor"
            } w-full btn mt-0 rounded-md`}
        >
          Schedule Management
        </button>
        <button
          onClick={() => setTab("profile")}
          className={`${tab === "profile"
              ? "bg-indigo-100 text-primaryColor font-bold"
              : "bg-transparent text-headingColor"
            } w-full btn mt-0 rounded-md`}
        >
          Profile Settings
        </button>
        <div className="mt-[100px] w-full">
          <button
            onClick={handleLogout}
            className="w-full bg-[#181A1E] p-3 text-[16px] leading-7 rounded-md text-white"
          >
            Logout
          </button>
          <button className="w-full bg-red-600 mt-4 p-3 text-[16px] leading-7 rounded-md text-white">
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
};
export default Tabs;
