import React, { useState, useEffect } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import HashLoader from 'react-spinners/HashLoader';
import { toast } from 'react-toastify';

const ServicesManagement = () => {
    const { data: fetchServices, loading, error } = useFetchData(`${BASE_URL}/services`);
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Inline edit/add states
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', desc: '' });
    
    const [isAdding, setIsAdding] = useState(false);
    const [addFormData, setAddFormData] = useState({ name: '', desc: '' });

    useEffect(() => {
        if (fetchServices) {
            setServices(fetchServices);
        }
    }, [fetchServices]);

    const filteredServices = services?.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Add Handlers ---
    const handleAddClick = () => {
        setIsAdding(true);
        setAddFormData({ name: '', desc: '' });
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
    };

    const handleSaveAdd = async () => {
        if (!addFormData.name || !addFormData.desc) {
            return toast.error("Please fill out all fields");
        }
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/services`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    name: addFormData.name, 
                    desc: addFormData.desc,
                    bgColor: "rgba(1, 181, 197, .2)", // default placeholder color
                    textColor: "#01B5C5"
                })
            });
            const result = await res.json();
            if(!res.ok) throw new Error(result.message);

            setServices([result.data, ...services]);
            setIsAdding(false);
            setTimeout(() => {
                toast.success("Service added successfully", { position: "top-right" });
            }, 100);
        } catch(err) {
            console.error(err);
            toast.error(err.message || "Failed to add service");
        }
    };

    // --- Edit Handlers ---
    const handleEditClick = (service) => {
        setEditingId(service._id);
        setEditFormData({ name: service.name, desc: service.desc });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/services/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    name: editFormData.name, 
                    desc: editFormData.desc
                })
            });
            const result = await res.json();
            if(!res.ok) throw new Error(result.message);

            setServices(prev => prev.map(s => s._id === id ? { ...s, name: editFormData.name, desc: editFormData.desc } : s));
            setEditingId(null);
            setTimeout(() => {
                toast.success("Service updated successfully", { position: "top-right" });
            }, 100);
        } catch(err) {
            console.error(err);
            toast.error(err.message || "Failed to update service");
        }
    };

    // --- Delete Handler ---
    const handleDelete = async (id) => {
        if(!window.confirm("Are you sure you want to delete this service?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/services/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if(!res.ok) throw new Error(result.message);

            setServices(prev => prev.filter(s => s._id !== id));
            setTimeout(() => {
                toast.success("Service deleted successfully", { position: "top-right" });
            }, 100);
        } catch(err) {
            toast.error("Failed to delete service");
        }
    };

    return (
        <section>
            <div className="flex flex-col mb-8 gap-6">
                <h2 className="text-3xl font-bold text-headingColor dark:text-white">Services Management</h2>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                    <input 
                        type="search" 
                        placeholder="Search by service name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="py-2 px-4 bg-[#0066ff2c] text-headingColor placeholder:text-textColor rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor dark:bg-slate-700 dark:text-white w-full md:w-[400px]"
                    />
                    <div className="flex gap-4 w-full md:w-auto md:justify-end">
                        <button 
                            onClick={handleAddClick}
                            disabled={isAdding}
                            className={`px-6 py-2 rounded-md font-semibold transition-colors whitespace-nowrap ${isAdding ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primaryColor text-white hover:bg-[#0052cc]'}`}
                        >
                            Add Service
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center h-40">
                    <HashLoader size={40} color="#0067FF" />
                </div>
            )}
            {error && <p className="text-red-500 font-semibold text-center">{error}</p>}

            {!loading && !error && filteredServices && (
                <div className="bg-white dark:bg-slate-800 shadow-panelShadow rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#f4f7ff] dark:bg-slate-700 text-textColor dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-[30%]">Service Name</th>
                                    <th className="px-6 py-4 font-semibold w-[50%]">Description</th>
                                    <th className="px-6 py-4 font-semibold text-right w-[20%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Inline Add Form */}
                                {isAdding && (
                                    <tr className="border-b dark:border-slate-700 bg-blue-50 dark:bg-slate-750">
                                        <td className="px-6 py-4">
                                            <input 
                                                type="text" 
                                                value={addFormData.name} 
                                                onChange={e => setAddFormData({...addFormData, name: e.target.value})}
                                                placeholder="Service Name"
                                                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                value={addFormData.desc} 
                                                onChange={e => setAddFormData({...addFormData, desc: e.target.value})}
                                                placeholder="Description..."
                                                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-3">
                                            <button onClick={handleSaveAdd} className="text-green-600 hover:text-green-800 font-bold">Save</button>
                                            <button onClick={handleCancelAdd} className="text-gray-500 hover:text-gray-700 font-semibold">Cancel</button>
                                        </td>
                                    </tr>
                                )}

                                {/* Service Rows */}
                                {filteredServices.map((service) => (
                                    <tr key={service._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                        
                                        {editingId === service._id ? (
                                            /* Editing Row */
                                            <>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="text" 
                                                        value={editFormData.name} 
                                                        onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                                                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="text" 
                                                        value={editFormData.desc} 
                                                        onChange={e => setEditFormData({...editFormData, desc: e.target.value})}
                                                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-3 items-center pt-6">
                                                    <button onClick={() => handleSaveEdit(service._id)} className="text-green-600 hover:text-green-800 font-bold">Save</button>
                                                    <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700 font-semibold">Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            /* Normal Row */
                                            <>
                                                <td className="px-6 py-4 font-semibold text-headingColor dark:text-white">
                                                    {service.name}
                                                </td>
                                                <td className="px-6 py-4 text-textColor dark:text-gray-300 truncate max-w-xs" title={service.desc}>
                                                    {service.desc}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleEditClick(service)} className="text-blue-600 hover:text-blue-800 mr-4 transition-colors font-medium">Edit</button>
                                                    <button onClick={() => handleDelete(service._id)} className="text-red-600 hover:text-red-800 transition-colors font-medium">Delete</button>
                                                </td>
                                            </>
                                        )}
                                        
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredServices.length === 0 && !isAdding && (
                            <div className="p-6 text-center text-textColor dark:text-gray-400">
                                No services found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default ServicesManagement;
