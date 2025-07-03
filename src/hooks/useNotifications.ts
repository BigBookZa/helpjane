import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';

export const useNotifications = () => {
  const error = useStore((state) => state.error);
  const setError = useStore((state) => state.setError);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showInfo = (message: string) => {
    toast(message, {
      icon: 'ℹ️',
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showLoading,
  };
};