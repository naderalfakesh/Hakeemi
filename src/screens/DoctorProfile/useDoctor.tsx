import { addWeeks, getDay } from 'date-fns';
import { eachDayOfInterval } from 'date-fns/esm';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Doctor } from '../../services/api/types';
import useToastMessage from '../../services/useToastMessage';

const useDoctor = (id: string) => {
  const [loading, setLoading] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availability, setAvailability] = useState<Array<Date> | null>(null);
  const toastMessage = useToastMessage();

  useEffect(() => {
    const getDoctors = async () => {
      setLoading(true);
      try {
        const result = await api.doctors.get(id);
        if (result) {
          setDoctor(result);
          setAvailability(availableDays(result.availability));
        }
        setLoading(false);
      } catch (error) {
        toastMessage.error(error);
        setLoading(false);
      }
    };
    getDoctors();
  }, [id]);

  const availableDays = (days: number[]): Array<Date> => {
    const today = new Date();
    const week = addWeeks(today, 1);
    const weekDays = eachDayOfInterval({ start: today, end: week });
    return weekDays.filter(day => days.includes(getDay(day)));
  };

  return { loading, doctor, availability };
};

export default useDoctor;
