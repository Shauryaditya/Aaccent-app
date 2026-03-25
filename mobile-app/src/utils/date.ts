import { format, formatDistance, formatRelative, isAfter, isBefore, parseISO } from 'date-fns';

export const formatDate = (date: string | Date, formatStr: string = 'PPP'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const formatDateRelative = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return '';
  }
};

export const isDatePast = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isBefore(dateObj, new Date());
  } catch (error) {
    return false;
  }
};

export const isDateFuture = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isAfter(dateObj, new Date());
  } catch (error) {
    return false;
  }
};