import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: 'gemini' | 'send' | 'folder' | 'file' | 'copy' | 'check' | 'user' | 'directory';
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'gemini':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12.012 2.25a.75.75 0 01.738.648l2.504 9.39a.75.75 0 01-.5 1.052l-9.39 2.504a.75.75 0 01-1.052-.5L1.816 6.054a.75.75 0 01.5-1.052l9.39-2.504a.75.75 0 01.306-.048zM12.012 4.17L4.316 6.31l2.056 7.698 7.698 2.056 2.056-7.7-4.114-4.194zM21 12a9 9 0