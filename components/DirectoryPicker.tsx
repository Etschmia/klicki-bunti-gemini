
import React from 'react';
import { Icon } from './Icon';

interface DirectoryPickerProps {
    onOpen: () => void;
    directoryName: string | null;
    isLoading: boolean;
}

const DirectoryPicker: React.FC<DirectoryPickerProps> = ({ onOpen, directoryName, isLoading }) => {
    return (
        <button
            onClick={onOpen}
            disabled={isLoading}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
        >
            <Icon name="directory" className="w-5 h-5 mr-2" />
            {isLoading ? 'Wird geladen...' : (directoryName ? directoryName : 'Verzeichnis auswählen')}
        </button>
    );
};

export default DirectoryPicker;
