import React from 'react'
import ServiceCard from './ServiceCard'
import useFetchData from '../../hooks/useFetchData'
import { BASE_URL } from '../../config'
import HashLoader from 'react-spinners/HashLoader'

const ServiceList = () => {
    const { data: services, loading, error } = useFetchData(`${BASE_URL}/services`);

    return (
        <>
            {loading && (
                <div className="flex justify-center items-center h-40">
                    <HashLoader size={40} color="#0067FF" />
                </div>
            )}
            {error && <p className="text-red-500 font-semibold text-center mt-5">{error}</p>}

            {!loading && !error && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-[30px] mt-[30px] lg:mt-[55px]'>
                    {services?.map((item, index) => <ServiceCard item={item} index={index} key={item._id || index} />)}
                </div>
            )}
        </>
    )
}

export default ServiceList