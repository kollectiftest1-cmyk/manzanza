"use client"

import dynamic from "next/dynamic"

const ReactApp = dynamic(() => import("../src/index"), { ssr: false })

export default function Page() {
  return (
    <div id="root">
      <ReactApp />
    </div>
  )
}
