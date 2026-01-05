import { useShallow } from 'zustand/shallow';
import { useModalStore } from '@/lib/stateManagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NetworkErrorModal = () => {
  const { t } = useTranslation();
  const { networkError, setNetworkError, operationFailedError, setOperationFailedError } = useModalStore(
    useShallow((state) => ({
      networkError: state.networkError,
      setNetworkError: state.setNetworkError,
      operationFailedError: state.operationFailedError,
      setOperationFailedError: state.setOperationFailedError,
    }))
  );

  const isOpen = networkError || !!operationFailedError;
  
  const handleClose = () => {
    setNetworkError(false);
    setOperationFailedError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>
              {operationFailedError 
                ? t('operationFailed.title', 'Operation Failed')
                : t('networkError.title', 'Network Error')}
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="pt-2">
          {operationFailedError 
            ? t('operationFailed.description', 'Network error prevented the operation from completing.')
            : t('networkError.description', 'Your changes could not be saved due to a network error.')}
        </DialogDescription>
        {!operationFailedError && (
          <DialogDescription>
            {t('networkError.reloadMessage', 'The document will be reloaded to the last saved version.')}
          </DialogDescription>
        )}
        <DialogFooter>
          <Button onClick={handleClose} variant="default">
            {t('networkError.ok', 'OK')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};