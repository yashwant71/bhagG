'use client'

import { useRouter } from 'next/navigation'
import CinematicIntro from '../src/components/CinematicIntro'

export default function Home() {
  const router = useRouter()

  const handleNext = () => {
    router.push('/chapter/1')
  }

  return <CinematicIntro onNext={handleNext} />
}
