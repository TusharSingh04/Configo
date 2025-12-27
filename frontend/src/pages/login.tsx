import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to home page (which is now the login page)
    router.replace('/');
  }, [router]);

  return <div style={{ padding: 24 }}>Redirecting...</div>;
}
