'use client'

import { useRouter } from 'next/navigation'
import ContextPage from '../src/components/ContextPage'

export default function Home() {
  const router = useRouter()

  const handleNext = () => {
    router.push('/verse/1')
  }

  return <ContextPage onNext={handleNext} />
}
