import React from 'react';
import Profile from '../../Dashboard/doctor-account/Profile';

const DoctorRegistration = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-panelShadow border border-gray-100 dark:border-slate-700">
            <Profile doctorData={null} isRegisterMode={true} />
        </div>
    );
};

export default DoctorRegistration;
