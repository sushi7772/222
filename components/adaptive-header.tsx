"use client"

import { useResponsive } from "@/hooks/use-responsive"
import Header from "@/components/header"
import MobileHeader from "@/components/mobile-header"

export default function AdaptiveHeader() {
  const { isMobile } = useResponsive()

  return isMobile ? <MobileHeader /> : <Header />
}
