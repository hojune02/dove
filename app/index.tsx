import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { getUserData } from '@/lib/storage';

export default function Index() {
  const [destination, setDestination] = useState<'/prayer' | '/landing' | null>(null);

  useEffect(() => {
    getUserData().then((data) => {
      setDestination(data.onboardingComplete ? '/prayer' : '/landing');
    });
  }, []);

  if (!destination) return null;
  return <Redirect href={destination} />;
}
