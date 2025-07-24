import React, { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/ui/Button';
// import Tab from '../components/ui/Tab';
import TabGroup from '../components/ui/TabGroup';

const Test: React.FC = () => {
    const { show, NotificationContainer } = useNotification();

    const showSuccessNotification = () => {
      show(
        <div>
          <h4 className="font-bold">Success!</h4>
          <p>Your action was completed successfully.</p>
        </div>,
        {
          type: 'success',
          position: 'top-right',
          duration: 5000,
        }
      );
    };
  
    const showErrorNotification = () => {
      show(
        <div>
          <h4 className="font-bold">Error!</h4>
          <p>Something went wrong. Please try again.</p>
        </div>,
        {
          type: 'error',
          position: 'bottom-left',
          duration: 7000,
        }
      );
    };
  
    const showWarningNotification = () => {
      show(
        <div>
          <h4 className="font-bold">Warning!</h4>
          <p>Please review your input before continuing.</p>
        </div>,
        {
          type: 'warning',
          position: 'top-left',
        }
      );
    };

    const tabs = [
      { id: 'login', label: 'Login' },
      { id: 'register', label: 'Register' },
    ];
    const [activeTab, setActiveTab] = useState('login');

    const handleTabChange = (tabId: string) => {
      setActiveTab(tabId);
    };
  
    return (
      <div className="p-4">
        <div className="space-x-4">
          <Button
            onClick={showSuccessNotification}
            className="px-4 py-2 bg-button-success text-white rounded"
          >
            Show Success
          </Button>
          <Button
            onClick={showErrorNotification}
            className="px-4 py-2 bg-button-error text-white rounded"
          >
            Show Error
          </Button>
          <Button
            onClick={showWarningNotification}
            className="px-4 py-2 bg-button-warning text-white rounded"
          >
            Show Warning
          </Button>
          <Button
            className="px-4 py-2 bg-button-primary text-white rounded"
          >
            Show Primary
          </Button>
          <Button
            className="px-4 py-2 bg-button-secondary text-white rounded"
          >
            Show Secondary
          </Button>
        </div>
        <TabGroup    tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
        {/* Render notifications */}
        <NotificationContainer />
      </div>
    );
};

export default Test;
