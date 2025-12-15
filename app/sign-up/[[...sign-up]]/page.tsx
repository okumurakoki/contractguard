'use client';

import { SignUp } from '@clerk/nextjs';
import { Box } from '@mui/material';

export default function SignUpPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#fafafa',
      }}
    >
      <SignUp
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'shadow-sm border border-gray-200 rounded-lg',
            headerTitle: 'text-2xl font-bold text-black',
            headerSubtitle: 'text-sm text-gray-600',
            socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50 text-black',
            formButtonPrimary: 'bg-black hover:bg-gray-800 text-white',
            formFieldInput: 'border-gray-300 focus:border-black focus:ring-black',
            footerActionLink: 'text-black hover:text-gray-700',
          },
        }}
      />
    </Box>
  );
}
