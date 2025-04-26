import { useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Redirect() {
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (!code) return;

    const fetchUrl = async () => {
      try {
        const res = await axios.get(`/api/redirect?code=${code}`);
        window.location.href = res.data.long_url; // Force redirect
      } catch (err) {
        router.push('/?error=Invalid+URL');
      }
    };

    fetchUrl();
  }, [code]);

  return <div>Redirecting...</div>;
}