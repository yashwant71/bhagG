'use client'

import { useRouter } from 'next/navigation'
import CinematicIntro from '../src/components/CinematicIntro'

export default function Home() {
  const router = useRouter()

  const handleNext = (target = '/verse/1/1') => {
    router.push(target)
  }

  return <CinematicIntro onNext={handleNext} />
}
