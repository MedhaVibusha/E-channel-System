import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authContext } from '../context/AuthContext';

const adminLinks = [
  { path: '/admin/overview', display: 'Overview' },
  { path: '/admin/doctors', display: 'Doctors' },
  { path: '/admin/patients', display: 'Patients' },
  { path: '/admin/register-doctor', display: 'Register Doctor' },
  { path: '/admin/register-patient', display: 'Register Patient' },
  { path: '/admin/services', display: 'Services' },
  { path: '/admin/appointments', display: 'Appointments' },
  { path: '/admin/reports', display: 'Reports' },
  { path: '/admin/payments', display: 'Payments' },
  { path: '/admin/schedules', display: 'Schedules' },
];

const AdminLayout = () => {
  const { dispatch } = useContext(authContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/admin/login');
  };

  return (
    <div className="max-w-[1170px] px-5 mx-auto py-10">
      <div className="grid md:grid-cols-3 gap-10">
        <div className="px-[30px] py-[50px] rounded-md h-full bg-slate-50 dark:bg-slate-800 shadow-panelShadow text-center lg:text-left">
          <h2 className="text-[20px] font-bold text-headingColor mb-8 dark:text-white">Admin Menu</h2>
          <ul className="flex flex-col gap-y-4">
            {adminLinks.map((link, index) => (
              <li key={index}>
                <NavLink
                  to={link.path}
                  className={(navClass) =>
                    navClass.isActive
                      ? 'text-white bg-primaryColor w-full py-2 px-4 rounded-md block transition-all duration-300 shadow-md font-semibold'
                      : 'text-textColor hover:text-primaryColor dark:text-gray-300 w-full py-2 px-4 block transition-all font-medium border-l-[3px] border-transparent hover:border-primaryColor hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                >
                  {link.display}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <button
              onClick={handleLogout}
              className="w-full bg-[#181A1E] dark:bg-red-600 hover:bg-red-600 p-3 text-[16px] leading-7 rounded-md text-white transition-all font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="md:col-span-2 md:px-[30px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
