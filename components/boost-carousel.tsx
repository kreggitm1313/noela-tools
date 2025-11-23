"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Rocket, Zap, Coins, ArrowRight } from "lucide-react"
import type { Pool } from "./noela-frame-app"

interface BoostCarouselProps {
  pools: Pool[]
  onNavigateToBoost?: () => void
}

export function BoostCarousel({ pools, onNavigateToBoost }: BoostCarouselProps) {
  const scrollToBoostTab = () => {
    if (onNavigateToBoost) {
      onNavigateToBoost()
    } else {
      // Fallback for backward compatibility
      const boostTab = document.querySelector('[value="boost"]') as HTMLElement
      if (boostTab) {
        boostTab.click()
        boostTab.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  const handleCreatePoolClick = () => {
    // Set a flag so CommunityBoost knows to open the create tab
    localStorage.setItem("open_create_pool", "true")
    scrollToBoostTab()
  }

  return (
    <div className="mt-12 mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse" />
          <h3 className="font-bold text-lg text-slate-800">
            Active Rewards <span className="text-xs font-normal text-muted-foreground ml-1">(Scroll)</span>
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-[#0052FF] hover:text-[#0041CC] hover:bg-blue-50 h-7"
          onClick={scrollToBoostTab}
        >
          View All <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {pools
          .filter((project) => project.status === "active" && project.participants < project.maxParticipants)
          .map((project) => (
            <div
              key={project.id}
              className="min-w-[240px] bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all snap-center flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${project.color} flex items-center justify-center text-xl shadow-sm text-white`}
                >
                  {project.logo}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{project.name}</h4>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 h-5 ${
                      project.status === "active"
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                    }`}
                  >
                    {project.status === "active" ? "Live" : "Ended"}
                  </Badge>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Reward</span>
                <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  {project.reward}
                </span>
              </div>

              <Button
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-9 text-sm font-medium shadow-sm"
                onClick={scrollToBoostTab}
              >
                Start Quest
              </Button>
            </div>
          ))}

        {/* CTA Card */}
        <div className="min-w-[240px] bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-md snap-center flex flex-col justify-center items-center text-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-bold text-white">BOOST YOUR POSTING 🟦</h4>
          <p className="text-xs text-blue-100 mb-2">Create a rain pool & get engagement</p>
          <Button
            variant="secondary"
            className="w-full bg-white text-blue-600 hover:bg-blue-50 h-8 text-xs rounded-xl"
            onClick={handleCreatePoolClick}
          >
            Create Pool
          </Button>
        </div>
      </div>
    </div>
  )
}
