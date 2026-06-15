import React from 'react';
import Profile from '../../Dashboard/user-account/Profile';

const PatientRegistration = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-panelShadow border border-gray-100 dark:border-slate-700">
            <Profile user={null} isRegisterMode={true} />
        </div>
    );
};

export default PatientRegistration;
